import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  calculateQuotationItem,
  calculateQuotationVariant,
  type QuotationData,
} from "@/lib/quotation";
import {
  formatDocumentDate,
  safeDocumentFilename,
  type GeneratedDocument,
} from "@/lib/generated-document";

const accent = (data: QuotationData) =>
  data.template === "classic"
    ? "#1e3a5f"
    : data.template === "modern"
      ? "#2563eb"
      : "#111827";
const money = (cents: number, data: QuotationData) => {
  try {
    return new Intl.NumberFormat(data.language === "hr" ? "hr-HR" : "en-GB", {
      style: "currency",
      currency: data.currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${data.currency}`;
  }
};
const companyText = (data: QuotationData) =>
  Object.entries(data.company)
    .filter(
      ([key, value]) =>
        key !== "visible" &&
        data.company.visible[key as keyof typeof data.company.visible] &&
        value,
    )
    .map(([, value]) => String(value))
    .join("\n");
const customerText = (data: QuotationData) =>
  [
    data.customer.name,
    data.customer.address,
    [data.customer.postalCode, data.customer.city, data.customer.country]
      .filter(Boolean)
      .join(" "),
    data.customer.taxNumber && `OIB / PIB: ${data.customer.taxNumber}`,
    data.customer.contactPerson,
    [data.customer.phone, data.customer.email].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join("\n");

export async function downloadQuotationPdf(document: GeneratedDocument) {
  const data = document.quotation!;
  const color = accent(data);
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const configured = pdfMake as typeof pdfMake & {
    vfs: Record<string, string>;
  };
  configured.vfs = fonts as unknown as Record<string, string>;
  const content: Content[] = [
    {
      columns: [
        {
          stack: [
            ...(document.images?.logo
              ? [{ image: document.images.logo, fit: [90, 34] } as Content]
              : []),
            { text: companyText(data), bold: true, margin: [0, 4, 0, 0] },
          ],
        },
        {
          stack: [
            {
              text: "PONUDA",
              fontSize: 22,
              bold: true,
              color,
              alignment: "right",
            },
            { text: data.number, bold: true, alignment: "right" },
            {
              text: `${formatDocumentDate(data.issueDate, data.language)}${data.validUntil ? ` · vrijedi do ${formatDocumentDate(data.validUntil, data.language)}` : ""}`,
              alignment: "right",
            },
            {
              text: data.status.toUpperCase(),
              color: "#64748b",
              fontSize: 7,
              alignment: "right",
            },
          ],
        },
      ],
      columnGap: 20,
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1.5,
          lineColor: color,
        },
      ],
      margin: [0, 8, 0, 10],
    },
    {
      columns: [
        {
          stack: [
            { text: "KUPAC", bold: true, color, fontSize: 8 },
            { text: customerText(data), margin: [0, 4, 0, 0] },
          ],
        },
        {
          stack: [
            ["Predmet", data.subject],
            ["Referenca", data.referenceNumber],
            [
              "Projekt / gradilište",
              [data.project, data.site].filter(Boolean).join(" · "),
            ],
            ["Odgovorna osoba", data.responsiblePerson],
            ["Prodajni predstavnik", data.salesRepresentative],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => ({
              text: [{ text: `${label}: `, color: "#64748b" }, String(value)],
            })),
        },
      ],
      columnGap: 20,
      margin: [0, 0, 0, 10],
    },
  ];
  for (const block of data.introBlocks.filter(
    (entry) => entry.visible && entry.content,
  ))
    content.push({
      stack: [
        { text: block.title, bold: true, color },
        { text: block.content, margin: [0, 3, 0, 0] },
      ],
      margin: [0, 6, 0, 6],
      unbreakable: true,
    });
  for (const variant of data.variants.filter(
    (entry) => entry.visible && entry.selectedForExport,
  )) {
    const summary = calculateQuotationVariant(
      variant,
      data.charges,
      data.globalDiscountRate,
    );
    content.push({
      text: `${variant.name}${variant.recommended ? " · PREPORUČENO" : ""}`,
      fontSize: 14,
      bold: true,
      color,
      margin: [0, 8, 0, 5],
    });
    for (const group of variant.groups.filter((entry) => entry.visible)) {
      content.push({
        text: `${group.name}${data.showPrices && group.discountRate ? ` · popust ${group.discountRate}%` : ""}`,
        bold: true,
        color,
        margin: [0, 5, 0, 3],
      });
      const labels = data.showPrices
        ? [
            "#",
            "Šifra / naziv i opis",
            "Kol.",
            "JM",
            "Cijena",
            "Popust",
            "PDV",
            "Ukupno",
          ]
        : ["#", "Šifra / naziv i opis", "Kol.", "JM"];
      const widths = data.showPrices
        ? [20, "*", 30, 28, 55, 38, 28, 62]
        : [24, "*", 50, 42];
      const rows: Content[][] = group.items
        .filter((entry) => entry.visible)
        .map((item, index) => {
          const amount = calculateQuotationItem(
            item,
            group.discountRate,
            data.globalDiscountRate,
          );
          const description: Content = {
            stack: [
              {
                text: `${item.code ? `${item.code} · ` : ""}${item.name || "—"}`,
                bold: true,
              },
              ...(item.description
                ? [{ text: item.description, color: "#64748b", fontSize: 7 }]
                : []),
              ...(item.note
                ? [
                    {
                      text: item.note,
                      italics: true,
                      color: "#64748b",
                      fontSize: 7,
                    },
                  ]
                : []),
            ],
          };
          const base: Content[] = [
            String(index + 1),
            description,
            String(item.quantity),
            item.unit,
          ];
          return data.showPrices
            ? [
                ...base,
                money(Math.round(item.unitPrice * 100), data),
                `${item.discountRate}%`,
                `${item.taxRate}%`,
                money(amount.totalCents, data),
              ]
            : base;
        });
      content.push({
        table: {
          headerRows: 1,
          widths,
          body: [
            labels.map((text): Content => ({
              text,
              bold: true,
              color: "#fff",
              fillColor: color,
              margin: [2, 3],
            })),
            ...rows,
          ],
        },
        layout: {
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#e2e8f0",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      });
    }
    if (data.showPrices) {
      const taxRows: Content[][] = Object.entries(summary.taxByRate).map(
        ([rate, value]) => [`PDV ${rate}%`, money(value, data)],
      );
      content.push({
        table: {
          widths: [110, 85],
          body: [
            ["Bruto vrijednost", money(summary.grossCents, data)],
            ["Ukupni popust", `− ${money(summary.discountCents, data)}`],
            ["Dodatni troškovi", money(summary.chargesCents, data)],
            ["Osnovica bez PDV-a", money(summary.subtotalCents, data)],
            ...taxRows,
            [
              { text: "Ukupno s PDV-om", bold: true },
              { text: money(summary.totalCents, data), bold: true, color },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [320, 10, 0, 5],
      });
    }
  }
  for (const block of data.conditions.filter(
    (entry) => entry.visible && entry.content,
  ))
    content.push({
      stack: [
        { text: block.title, bold: true, color },
        { text: block.content, margin: [0, 2, 0, 0] },
      ],
      margin: [0, 6, 0, 0],
      unbreakable: true,
    });
  if (data.showAcceptanceText && data.acceptanceText)
    content.push({
      text: data.acceptanceText,
      italics: true,
      margin: [0, 12, 0, 0],
    });
  const signs: Content[] = data.signatures
    .filter((entry) => entry.visible)
    .map((entry): Content => ({
      stack: [
        { text: entry.title, bold: true, alignment: "center" },
        { text: entry.name, alignment: "center", margin: [0, 18, 0, 0] },
        { text: entry.role, alignment: "center", color: "#64748b" },
        {
          text: formatDocumentDate(entry.date, data.language),
          alignment: "center",
        },
      ],
    }));
  if (signs.length)
    content.push({
      table: {
        widths: signs.map(() => "*"),
        body: [signs],
        dontBreakRows: true,
      },
      layout: {
        hLineWidth: (index) => (index === 0 ? 1 : 0),
        vLineWidth: () => 0,
      },
      margin: [0, 18, 0, 0],
    });
  const images: Content[] = [];
  if (document.images?.signature)
    images.push({
      image: document.images.signature,
      fit: [90, 36],
      alignment: "right",
    });
  if (document.images?.stamp)
    images.push({
      image: document.images.stamp,
      fit: [62, 45],
      alignment: "right",
    });
  if (images.length)
    content.push({ columns: [{ text: "" }, ...images], margin: [0, 6, 0, 0] });
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 42, 40, 45],
    content,
    defaultStyle: { font: "Roboto", fontSize: 8.2, lineHeight: 1.15 },
    footer: (page, pages) => ({
      columns: [
        { text: data.company.name || "Ponuda", fontSize: 7, color: "#64748b" },
        {
          text: `Stranica ${page} / ${pages}`,
          alignment: "right",
          fontSize: 7,
          color: "#64748b",
        },
      ],
      margin: [40, 16, 40, 0],
    }),
    info: {
      title: `Ponuda ${data.number}`,
      creator: data.company.name || "Dokument AI",
    },
  };
  configured
    .createPdf(definition)
    .download(safeDocumentFilename(document, "pdf"));
}

function bytes(value: string) {
  const binary = atob(value.split(",")[1] ?? "");
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function imageType(value: string): "jpg" | "png" {
  return value.startsWith("data:image/jpeg") ? "jpg" : "png";
}

export async function downloadQuotationDocx(document: GeneratedDocument) {
  const data = document.quotation!;
  const d = await import("docx");
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = d;
  const paragraph = (text: string, bold = false) =>
    new Paragraph({
      children: [new TextRun({ text, bold, font: "Arial", size: 18 })],
      spacing: { after: 50 },
    });
  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "PONUDA", bold: true, size: 38, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `${data.number}\n${formatDocumentDate(data.issueDate, data.language)} · ${data.status}`,
          font: "Arial",
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 10, color: "1E293B" },
      },
    }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                paragraph("KUPAC", true),
                paragraph(customerText(data)),
              ],
            }),
            new TableCell({
              children: [
                paragraph("PODACI PONUDE", true),
                paragraph(
                  [
                    data.subject,
                    data.referenceNumber,
                    data.project,
                    data.site,
                    data.responsiblePerson,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
  for (const block of data.introBlocks.filter(
    (entry) => entry.visible && entry.content,
  ))
    children.push(paragraph(`${block.title}\n${block.content}`, true));
  for (const variant of data.variants.filter(
    (entry) => entry.visible && entry.selectedForExport,
  )) {
    children.push(
      paragraph(
        `${variant.name}${variant.recommended ? " · PREPORUČENO" : ""}`,
        true,
      ),
    );
    for (const group of variant.groups.filter((entry) => entry.visible)) {
      children.push(paragraph(group.name, true));
      const labels = data.showPrices
        ? [
            "#",
            "Šifra / naziv i opis",
            "Kol.",
            "JM",
            "Cijena",
            "Popust",
            "PDV",
            "Ukupno",
          ]
        : ["#", "Šifra / naziv i opis", "Kol.", "JM"];
      const rows = [
        new TableRow({
          tableHeader: true,
          children: labels.map(
            (label) =>
              new TableCell({
                shading: { fill: "1E293B" },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: label,
                        bold: true,
                        color: "FFFFFF",
                        font: "Arial",
                        size: 15,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
        ...group.items
          .filter((entry) => entry.visible)
          .map((item, index) => {
            const amount = calculateQuotationItem(
              item,
              group.discountRate,
              data.globalDiscountRate,
            );
            const values = [
              String(index + 1),
              [item.code, item.name, item.description, item.note]
                .filter(Boolean)
                .join("\n"),
              String(item.quantity),
              item.unit,
            ];
            if (data.showPrices)
              values.push(
                money(Math.round(item.unitPrice * 100), data),
                `${item.discountRate}%`,
                `${item.taxRate}%`,
                money(amount.totalCents, data),
              );
            return new TableRow({
              children: values.map(
                (value) =>
                  new TableCell({
                    children: value.split("\n").map((line) => paragraph(line)),
                  }),
              ),
            });
          }),
      ];
      children.push(
        new Table({ width: { size: 9360, type: WidthType.DXA }, rows }),
      );
    }
    if (data.showPrices) {
      const summary = calculateQuotationVariant(
        variant,
        data.charges,
        data.globalDiscountRate,
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Bruto: ${money(summary.grossCents, data)}\nPopusti: ${money(summary.discountCents, data)}\nTroškovi: ${money(summary.chargesCents, data)}\nOsnovica: ${money(summary.subtotalCents, data)}\n${Object.entries(
                summary.taxByRate,
              )
                .map(([rate, value]) => `PDV ${rate}%: ${money(value, data)}`)
                .join("\n")}\nUKUPNO: ${money(summary.totalCents, data)}`,
              bold: true,
              font: "Arial",
              size: 18,
            }),
          ],
        }),
      );
    }
  }
  for (const block of data.conditions.filter(
    (entry) => entry.visible && entry.content,
  ))
    children.push(paragraph(`${block.title}\n${block.content}`, true));
  if (data.showAcceptanceText && data.acceptanceText)
    children.push(paragraph(data.acceptanceText));
  if (data.signatures.some((entry) => entry.visible)) {
    const cells = data.signatures
      .filter((entry) => entry.visible)
      .map(
        (entry) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "64748B" },
                },
                children: [
                  new TextRun({
                    text: `${entry.title}\n\n${entry.name}\n${entry.role}\n${formatDocumentDate(entry.date, data.language)}`,
                    bold: true,
                    font: "Arial",
                    size: 15,
                  }),
                ],
              }),
            ],
          }),
      );
    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [new TableRow({ children: cells })],
      }),
    );
  }
  if (document.images?.signature || document.images?.stamp)
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          document.images.signature &&
            new ImageRun({
              data: bytes(document.images.signature),
              transformation: { width: 90, height: 36 },
              type: imageType(document.images.signature),
            }),
          document.images.stamp &&
            new ImageRun({
              data: bytes(document.images.stamp),
              transformation: { width: 62, height: 45 },
              type: imageType(document.images.stamp),
            }),
        ].filter(Boolean) as InstanceType<typeof ImageRun>[],
      }),
    );
  const headerChildren = document.images?.logo
    ? [
        new Paragraph({
          children: [
            new ImageRun({
              data: bytes(document.images.logo),
              transformation: { width: 90, height: 32 },
              type: imageType(document.images.logo),
            }),
          ],
        }),
        paragraph(companyText(data)),
      ]
    : [paragraph(companyText(data), true)];
  const output = new Document({
    creator: data.company.name || "Dokument AI",
    title: `Ponuda ${data.number}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 900,
              right: 850,
              bottom: 900,
              left: 850,
              header: 450,
              footer: 450,
            },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${data.company.name || "Ponuda"} · Stranica `,
                    font: "Arial",
                    size: 15,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                    size: 15,
                  }),
                  new TextRun({ text: " / ", font: "Arial", size: 15 }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Arial",
                    size: 15,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(output);
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = safeDocumentFilename(document, "docx");
  anchor.click();
  URL.revokeObjectURL(url);
}
