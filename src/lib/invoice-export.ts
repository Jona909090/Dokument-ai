import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  calculateInvoice,
  calculateInvoiceItem,
  type InvoiceData,
} from "@/lib/invoice";
import {
  formatDocumentDate,
  safeDocumentFilename,
  type GeneratedDocument,
} from "@/lib/generated-document";

function money(cents: number, data: InvoiceData) {
  try {
    return new Intl.NumberFormat(data.language === "en" ? "en-GB" : "hr-HR", {
      style: "currency",
      currency: data.currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${data.currency}`;
  }
}
function party(
  data: InvoiceData["customer"],
  company?: InvoiceData["company"],
) {
  const visible = (key: string) => !company || company.visible[key] !== false;
  return [
    visible("name") && data.name,
    visible("address") && data.address,
    visible("city") && [data.postalCode, data.city].filter(Boolean).join(" "),
    visible("country") && data.country,
    visible("taxNumber") && data.taxNumber && `OIB / PIB: ${data.taxNumber}`,
    visible("vatNumber") && data.vatNumber && `PDV: ${data.vatNumber}`,
    visible("contactPerson") &&
      data.contactPerson &&
      `Kontakt: ${data.contactPerson}`,
    visible("phone") && data.phone,
    visible("email") && data.email,
  ]
    .filter(Boolean)
    .join("\n");
}
function title(data: InvoiceData) {
  return data.type === "storno"
    ? "STORNO FAKTURA"
    : data.type === "proforma"
      ? "PREDRAČUN / PROFORMA"
      : data.language === "en"
        ? "INVOICE"
        : "FAKTURA";
}
export async function downloadInvoicePdf(document: GeneratedDocument) {
  const data = document.invoice!;
  const summary = calculateInvoice(data);
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const configured = pdfMake as typeof pdfMake & {
    vfs: Record<string, string>;
  };
  configured.vfs = pdfFonts as unknown as Record<string, string>;
  const accent =
    data.template === "modern"
      ? "#2563eb"
      : data.template === "minimal"
        ? "#334155"
        : "#0f172a";
  const content: Content[] = [
    {
      columns: [
        {
          stack: [
            ...(document.images?.logo && data.headerLayout !== "minimal"
              ? [{ image: document.images.logo, fit: [105, 40] } as Content]
              : []),
            {
              text: party(data.company, data.company),
              fontSize: 8.5,
              bold: true,
            },
          ],
        },
        {
          stack: [
            {
              text: title(data),
              fontSize: 22,
              bold: true,
              alignment: "right",
              color: accent,
            },
            {
              text: data.number || "—",
              fontSize: 14,
              bold: true,
              alignment: "right",
            },
            { text: data.status, alignment: "right", color: "#64748b" },
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
          lineColor: accent,
        },
      ],
      margin: [0, 8, 0, 10],
    },
    {
      columns: [
        {
          stack: [
            {
              text: data.language === "en" ? "CUSTOMER" : "KUPAC",
              bold: true,
              fontSize: 8,
              color: "#64748b",
            },
            { text: party(data.customer), margin: [0, 4, 0, 0] },
          ],
        },
        {
          table: {
            widths: [75, "*"],
            body: [
              [
                "Datum izdavanja",
                formatDocumentDate(data.issueDate, data.language),
              ],
              [
                { text: "Dospijeće", bold: true, color: accent },
                {
                  text: formatDocumentDate(data.dueDate, data.language),
                  bold: true,
                  color: accent,
                },
              ],
              [
                "Datum isporuke",
                formatDocumentDate(data.serviceDate, data.language),
              ],
              ["Mjesto", data.issuePlace],
              ["Narudžbenica", data.customerOrderNumber],
            ].filter((row) => row[1]) as Content[][],
          },
          layout: "noBorders",
        },
      ],
      columnGap: 20,
      margin: [0, 0, 0, 12],
    },
  ];
  for (const group of data.groups.filter((g) => g.visible)) {
    const rows = group.items
      .filter((i) => i.visible)
      .map((item, index) => {
        const value = calculateInvoiceItem(
          item,
          group.discountRate,
          data.globalDiscountRate,
          data.taxMode,
        );
        const base: Content[] = [
          String(index + 1),
          {
            stack: [
              {
                text: [item.code, item.name].filter(Boolean).join(" · "),
                bold: true,
              },
              { text: item.description, color: "#64748b", fontSize: 7.5 },
              { text: item.note, italics: true, color: "#64748b", fontSize: 7 },
            ],
          },
          String(item.quantity),
          item.unit,
        ];
        return data.showFinancials === false ? base : [...base,
          money(Math.round(item.unitPrice * 100), data),
          `${item.discountRate}%`,
          data.taxMode === "standard" || data.taxMode === "prilagođeno"
            ? `${item.taxRate}%`
            : "—",
          money(value.totalCents, data),
        ] as Content[];
      });
    content.push(
      { text: group.name, bold: true, color: accent, margin: [0, 8, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: data.showFinancials === false ? [20, "*", 45, 35] : [20, "*", 30, 28, 56, 34, 28, 64],
          body: [
            (data.showFinancials === false ? ["#", "Naziv / opis", "Kol.", "JM"] : [
              "#",
              "Naziv / opis",
              "Kol.",
              "JM",
              "Cijena",
              "Pop.",
              "PDV",
              "Ukupno",
            ]).map((text) => ({
              text,
              bold: true,
              color: "#fff",
              fillColor: accent,
              margin: [2, 4],
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
      },
    );
  }
  const totals: Content[][] = [
    ["Bruto vrijednost", money(summary.grossCents, data)],
    ["Popust", `− ${money(summary.discountCents, data)}`],
    ...data.charges
      .filter((c) => c.includedInCalculation && c.visible)
      .map(
        (c) => [c.name, money(Math.round(c.amount * 100), data)] as Content[],
      ),
    ["Porezna osnovica", money(summary.netCents, data)],
    ...Object.entries(summary.taxByRate).map(
      ([rate, value]) =>
        [`PDV ${rate}%`, money(value.taxCents, data)] as Content[],
    ),
    ...(data.type === "završna" && data.previousAdvance > 0
      ? [
          [
            "Odbitak avansa",
            `− ${money(Math.round(data.previousAdvance * 100), data)}`,
          ] as Content[],
        ]
      : []),
    [
      { text: "UKUPNO", bold: true },
      { text: money(summary.totalCents, data), bold: true, color: accent },
    ],
    ["Plaćeno", money(summary.paidCents, data)],
    [
      { text: "ZA UPLATU", bold: true, fillColor: accent, color: "#fff" },
      {
        text: money(summary.remainingCents, data),
        bold: true,
        fillColor: accent,
        color: "#fff",
      },
    ],
  ];
  if (data.showFinancials !== false) content.push({
    table: { widths: [105, 85], body: totals },
    layout: "lightHorizontalLines",
    margin: [325, 12, 0, 0],
  });
  if (data.showLegalNote && data.legalNote)
    content.push({
      stack: [
        { text: "POREZNA NAPOMENA", bold: true, fontSize: 8 },
        { text: data.legalNote, margin: [0, 3, 0, 0] },
        {
          text: "Provjerite porezni i pravni tekst prije izdavanja fakture.",
          color: "#b45309",
          fontSize: 7.5,
          margin: [0, 3, 0, 0],
        },
      ],
      margin: [0, 10, 0, 0],
      unbreakable: true,
    });
  const paymentLines = [
    ["IBAN", data.payment.iban],
    ["SWIFT", data.payment.swift],
    ["Banka", data.payment.bankName],
    [
      "Model / poziv",
      [data.payment.model, data.payment.reference].filter(Boolean).join(" "),
    ],
    ["Opis", data.payment.description],
    ["Način", data.payment.method],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  if (paymentLines)
    content.push({
      text: `PODACI ZA PLAĆANJE\n${paymentLines}`,
      bold: true,
      margin: [0, 10, 0, 0],
      unbreakable: true,
    });
  if (data.payment.showCodePlaceholder)
    content.push({
      text: "Mjesto za budući standardizirani 2D/QR kod plaćanja",
      color: "#94a3b8",
      fontSize: 8,
      margin: [0, 5, 0, 0],
    });
  if (data.payments.length)
    content.push({
      text: `EVIDENTIRANE UPLATE\n${data.payments.map((p) => `${formatDocumentDate(p.date, data.language)} · ${money(Math.round(p.amount * 100), data)} · ${p.method}`).join("\n")}`,
      margin: [0, 10, 0, 0],
    });
  if (data.note)
    content.push({ text: `NAPOMENA\n${data.note}`, margin: [0, 10, 0, 0] });
  for (const block of data.blocks.filter(
    (b) => b.visible && !b.internal && b.content,
  ))
    content.push({
      text: `${block.title.toUpperCase()}\n${block.content}`,
      margin: [0, 10, 0, 0],
      unbreakable: true,
    });
  const signatureCells: Content[] = data.signatures
    .filter((s) => s.visible)
    .map((s, index) => ({
      stack: [
        { text: s.title, bold: true, alignment: "center" },
        { text: s.name, alignment: "center", margin: [0, 20, 0, 0] },
        {
          text: [s.role, formatDocumentDate(s.date, data.language)]
            .filter(Boolean)
            .join(" · "),
          alignment: "center",
          color: "#64748b",
        },
        ...(index === 0 && document.images?.signature
          ? [
              {
                image: document.images.signature,
                fit: [85, 32],
                alignment: "center",
              } as Content,
            ]
          : []),
        ...(index === 0 && document.images?.stamp
          ? [
              {
                image: document.images.stamp,
                fit: [55, 42],
                alignment: "center",
              } as Content,
            ]
          : []),
      ],
    }));
  if (signatureCells.length)
    content.push({
      table: { widths: signatureCells.map(() => "*"), body: [signatureCells] },
      layout: { hLineWidth: (i) => (i === 0 ? 1 : 0), vLineWidth: () => 0 },
      margin: [0, 20, 0, 0],
    });
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 42, 40, 44],
    content,
    defaultStyle: { font: "Roboto", fontSize: 8.5, lineHeight: 1.15 },
    footer: (page, pages) => ({
      columns: [
        { text: data.company.name || "Faktura", color: "#64748b", fontSize: 7 },
        {
          text: `Stranica ${page} / ${pages}`,
          alignment: "right",
          color: "#64748b",
          fontSize: 7,
        },
      ],
      margin: [40, 16, 40, 0],
    }),
    info: {
      title: `${title(data)} ${data.number}`,
      creator: data.company.name || "Dokument AI",
    },
  };
  configured
    .createPdf(definition)
    .download(safeDocumentFilename(document, "pdf"));
}
function dataUrl(value: string) {
  const binary = atob(value.split(",")[1] ?? "");
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
function imageType(value: string): "jpg" | "png" {
  return value.startsWith("data:image/jpeg") ? "jpg" : "png";
}
export async function downloadInvoiceDocx(document: GeneratedDocument) {
  const data = document.invoice!;
  const summary = calculateInvoice(data);
  const d = await import("docx");
  const {
    AlignmentType,
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
  const p = (text: string, bold = false) =>
    new Paragraph({
      children: [new TextRun({ text, bold, font: "Arial", size: 18 })],
      spacing: { after: 55 },
    });
  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [p(party(data.company, data.company), true)],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${title(data)}\n${data.number}\n${data.status}`,
                      bold: true,
                      font: "Arial",
                      size: 30,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [p(`KUPAC\n${party(data.customer)}`, true)],
            }),
            new TableCell({
              children: [
                p(
                  `Datum izdavanja: ${formatDocumentDate(data.issueDate, data.language)}\nDospijeće: ${formatDocumentDate(data.dueDate, data.language)}\nDatum isporuke: ${formatDocumentDate(data.serviceDate, data.language)}\nMjesto: ${data.issuePlace}`,
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
  for (const group of data.groups.filter((g) => g.visible)) {
    children.push(p(group.name, true));
    const rows = [
      new TableRow({
        tableHeader: true,
        children: (data.showFinancials === false ? ["#", "Naziv / opis", "Kol.", "JM"] : [
          "#",
          "Naziv / opis",
          "Kol.",
          "JM",
          "Cijena",
          "Pop.",
          "PDV",
          "Ukupno",
        ]).map(
          (v) =>
            new TableCell({
              shading: { fill: "1E293B" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: v,
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
        .filter((i) => i.visible)
        .map((item, index) => {
          const value = calculateInvoiceItem(
            item,
            group.discountRate,
            data.globalDiscountRate,
            data.taxMode,
          );
          return new TableRow({
            children: (data.showFinancials === false ? [
              String(index + 1),
              [item.code, item.name, item.description, item.note].filter(Boolean).join("\n"),
              String(item.quantity),
              item.unit,
            ] : [
              String(index + 1),
              [item.code, item.name, item.description, item.note]
                .filter(Boolean)
                .join("\n"),
              String(item.quantity),
              item.unit,
              money(Math.round(item.unitPrice * 100), data),
              `${item.discountRate}%`,
              `${item.taxRate}%`,
              money(value.totalCents, data),
            ]).map(
              (v) =>
                new TableCell({
                  children: v.split("\n").map((line) => p(line)),
                }),
            ),
          });
        }),
    ];
    children.push(
      new Table({ width: { size: 9360, type: WidthType.DXA }, rows }),
    );
  }
  if (data.showFinancials !== false) children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Porezna osnovica: ${money(summary.netCents, data)}\nPDV: ${money(summary.taxCents, data)}\nUKUPNO: ${money(summary.totalCents, data)}\nPlaćeno: ${money(summary.paidCents, data)}\nZA UPLATU: ${money(summary.remainingCents, data)}`,
          bold: true,
          font: "Arial",
          size: 20,
        }),
      ],
    }),
  );
  if (data.showLegalNote && data.legalNote)
    children.push(
      p(
        `POREZNA NAPOMENA\n${data.legalNote}\nProvjerite porezni i pravni tekst prije izdavanja fakture.`,
        true,
      ),
    );
  children.push(
    p(
      `PODACI ZA PLAĆANJE\nIBAN: ${data.payment.iban}\nSWIFT: ${data.payment.swift}\nBanka: ${data.payment.bankName}\nModel / poziv: ${data.payment.model} ${data.payment.reference}\nNačin: ${data.payment.method}`,
      true,
    ),
  );
  if (data.payment.showCodePlaceholder)
    children.push(p("Mjesto za budući standardizirani 2D/QR kod plaćanja"));
  for (const block of data.blocks.filter(
    (b) => b.visible && !b.internal && b.content,
  ))
    children.push(p(`${block.title.toUpperCase()}\n${block.content}`, true));
  if (document.images?.signature || document.images?.stamp)
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          document.images.signature &&
            new ImageRun({
              data: dataUrl(document.images.signature),
              transformation: { width: 90, height: 34 },
              type: imageType(document.images.signature),
            }),
          document.images.stamp &&
            new ImageRun({
              data: dataUrl(document.images.stamp),
              transformation: { width: 60, height: 45 },
              type: imageType(document.images.stamp),
            }),
        ].filter(Boolean) as InstanceType<typeof ImageRun>[],
      }),
    );
  const headerChildren =
    document.images?.logo && data.headerLayout !== "minimal"
      ? [
          new Paragraph({
            children: [
              new ImageRun({
                data: dataUrl(document.images.logo),
                transformation: { width: 100, height: 36 },
                type: imageType(document.images.logo),
              }),
            ],
          }),
        ]
      : [new Paragraph("")];
  const output = new Document({
    creator: data.company.name || "Dokument AI",
    title: `${title(data)} ${data.number}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 850,
              right: 800,
              bottom: 850,
              left: 800,
              header: 420,
              footer: 420,
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
                    text: `${data.company.name} · Stranica `,
                    font: "Arial",
                    size: 14,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                    size: 14,
                  }),
                  new TextRun({ text: " / ", font: "Arial", size: 14 }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Arial",
                    size: 14,
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
