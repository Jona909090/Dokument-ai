import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

import {
  formatDocumentDate,
  safeDocumentFilename,
  type GeneratedDocument,
} from "@/lib/generated-document";
import {
  downloadPurchaseOrderDocx,
  downloadPurchaseOrderPdf,
} from "@/lib/purchase-order-export";
import {
  downloadQuotationDocx,
  downloadQuotationPdf,
} from "@/lib/quotation-export";
import { downloadInvoiceDocx, downloadInvoicePdf } from "@/lib/invoice-export";
import { buildVisibleDocumentModel } from "@/lib/document-visibility";
import { downloadDailyReportDocx, downloadDailyReportPdf } from "@/lib/daily-report-export";

const euro = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
});

function displayValue(
  value: string,
  type: "date" | "multiline" | undefined,
  locale: GeneratedDocument["locale"],
) {
  return type === "date" ? formatDocumentDate(value, locale) : value;
}

export async function downloadPdf(document: GeneratedDocument) {
  document = buildVisibleDocumentModel(document);
  if (document.dailyReport) return downloadDailyReportPdf(document);
  if (document.invoice) return downloadInvoicePdf(document);
  if (document.quotation) return downloadQuotationPdf(document);
  if (document.purchaseOrder) return downloadPurchaseOrderPdf(document);
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const configuredPdfMake = pdfMake as typeof pdfMake & {
    vfs: Record<string, string>;
  };
  configuredPdfMake.vfs = pdfFonts as unknown as Record<string, string>;

  const fieldContent: Content[] = document.fields.map((field) => ({
    stack: [
      {
        text: field.label.toLocaleUpperCase(document.locale),
        color: "#64748b",
        fontSize: 8,
        bold: true,
        characterSpacing: 0.6,
      },
      {
        text: displayValue(field.value, field.type, document.locale) || "-",
        color: "#0f172a",
        fontSize: 10.5,
        margin: [0, 3, 0, 0],
      },
    ],
    margin: [0, 0, 0, 13],
  }));

  const content: Content[] = [
    { text: document.title, style: "title" },
    {
      text:
        document.locale === "hr"
          ? "Profesionalno pripremljen dokument"
          : "Professionally prepared document",
      style: "subtitle",
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 475,
          y2: 0,
          lineWidth: 1,
          lineColor: "#dbeafe",
        },
      ],
      margin: [0, 0, 0, 22],
    },
    ...fieldContent,
  ];

  if (document.items?.length) {
    content.push(
      {
        text: document.locale === "hr" ? "Stavke" : "Items",
        style: "section",
        margin: [0, 8, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 55, 75, 80],
          body: [
            ["Opis", "Količina", "Cijena", "Iznos"].map((text) => ({
              text,
              bold: true,
              color: "#ffffff",
              fillColor: "#2563eb",
              margin: [5, 6],
            })),
            ...document.items.map((item) => [
              item.description,
              String(item.quantity),
              euro.format(item.price),
              euro.format(item.amount),
            ]),
          ],
        },
        layout: {
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#cbd5e1",
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
    );
  }

  if (document.totals) {
    content.push({
      table: {
        widths: ["*", 110],
        body: [
          ["Ukupno bez PDV-a", euro.format(document.totals.subtotal)],
          [
            `PDV (${document.totals.taxRate}%)`,
            euro.format(document.totals.tax),
          ],
          [
            { text: "Ukupno s PDV-om", bold: true },
            {
              text: euro.format(document.totals.total),
              bold: true,
              color: "#1d4ed8",
            },
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [250, 18, 0, 0],
    });
  }

  const signingCells: Content[] = [];
  if (document.images?.signature)
    signingCells.push({
      stack: [
        {
          image: document.images.signature,
          fit: [100, 40],
          alignment: "center",
        },
        {
          text: "Potpis",
          alignment: "center",
          fontSize: 7,
          color: "#64748b",
          margin: [0, 2, 0, 0],
        },
      ],
    });
  if (document.images?.stamp)
    signingCells.push({
      stack: [
        { image: document.images.stamp, fit: [70, 45], alignment: "center" },
        {
          text: "Pečat",
          alignment: "center",
          fontSize: 7,
          color: "#64748b",
          margin: [0, 2, 0, 0],
        },
      ],
    });
  if (signingCells.length)
    content.push({
      table: {
        dontBreakRows: true,
        widths: signingCells.map(() => "*"),
        body: [signingCells],
      },
      layout: "noBorders",
      margin: [0, 12, 0, 0],
    });

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [60, 72, 60, 62],
    header: {
      columns: [
        document.images?.logo
          ? { image: document.images.logo, fit: [90, 32] }
          : { text: "DOKUMENT AI", bold: true, color: "#2563eb", fontSize: 10 },
        {
          text: document.title,
          alignment: "right",
          color: "#64748b",
          fontSize: 8,
        },
      ],
      margin: [60, 28, 60, 0],
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "Dokument AI", color: "#94a3b8", fontSize: 8 },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          color: "#64748b",
          fontSize: 8,
        },
      ],
      margin: [60, 18, 60, 0],
    }),
    content,
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.25 },
    styles: {
      title: {
        fontSize: 24,
        bold: true,
        color: "#0f172a",
        margin: [0, 4, 0, 6],
      },
      subtitle: { fontSize: 10, color: "#64748b", margin: [0, 0, 0, 18] },
      section: { fontSize: 14, bold: true, color: "#1e3a8a" },
    },
    info: {
      title: document.title,
      author: "Dokument AI",
      creator: "Dokument AI",
    },
  };

  configuredPdfMake
    .createPdf(definition)
    .download(safeDocumentFilename(document, "pdf"));
}

function dataUrlToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function imageType(dataUrl: string): "jpg" | "png" {
  return dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png";
}

export async function downloadDocx(documentData: GeneratedDocument) {
  documentData = buildVisibleDocumentModel(documentData);
  if (documentData.dailyReport) return downloadDailyReportDocx(documentData);
  if (documentData.invoice) return downloadInvoiceDocx(documentData);
  if (documentData.quotation) return downloadQuotationDocx(documentData);
  if (documentData.purchaseOrder)
    return downloadPurchaseOrderDocx(documentData);
  const docx = await import("docx");
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
  } = docx;

  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = [
    new Paragraph({
      children: [
        new TextRun({
          text: documentData.title,
          bold: true,
          size: 40,
          color: "0F172A",
          font: "Arial",
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            documentData.locale === "hr"
              ? "Profesionalno pripremljen dokument"
              : "Professionally prepared document",
          size: 19,
          color: "64748B",
          font: "Arial",
        }),
      ],
      spacing: { after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, color: "DBEAFE", size: 8 },
      },
    }),
  ];

  for (const field of documentData.fields) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: field.label.toUpperCase(),
            bold: true,
            size: 16,
            color: "64748B",
            font: "Arial",
          }),
        ],
        spacing: { before: 80, after: 40 },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              displayValue(field.value, field.type, documentData.locale) || "-",
            size: 21,
            color: "0F172A",
            font: "Arial",
          }),
        ],
        spacing: { after: 120, line: 280 },
      }),
    );
  }

  if (documentData.items?.length) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: documentData.locale === "hr" ? "Stavke" : "Items",
            bold: true,
            size: 28,
            color: "1E3A8A",
            font: "Arial",
          }),
        ],
        spacing: { before: 240, after: 120 },
        keepNext: true,
      }),
    );
    const rows = [
      new TableRow({
        tableHeader: true,
        children: ["Opis", "Količina", "Cijena", "Iznos"].map(
          (text) =>
            new TableCell({
              shading: { fill: "2563EB" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: true,
                      color: "FFFFFF",
                      font: "Arial",
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
      ...documentData.items.map(
        (item) =>
          new TableRow({
            children: [
              item.description,
              String(item.quantity),
              euro.format(item.price),
              euro.format(item.amount),
            ].map(
              (text) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text, size: 18, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
            ),
          }),
      ),
    ];
    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [5040, 1080, 1440, 1800],
        rows,
      }),
    );
  }

  if (documentData.totals) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 240, after: 60 },
        children: [
          new TextRun({
            text: `Ukupno bez PDV-a: ${euro.format(documentData.totals.subtotal)}`,
            font: "Arial",
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `PDV (${documentData.totals.taxRate}%): ${euro.format(documentData.totals.tax)}`,
            font: "Arial",
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: `Ukupno s PDV-om: ${euro.format(documentData.totals.total)}`,
            bold: true,
            color: "1D4ED8",
            size: 24,
            font: "Arial",
          }),
        ],
      }),
    );
  }

  const signatureRuns = [];
  if (documentData.images?.signature)
    signatureRuns.push(
      new ImageRun({
        data: dataUrlToUint8Array(documentData.images.signature),
        transformation: { width: 140, height: 55 },
        type: imageType(documentData.images.signature),
      }),
    );
  if (documentData.images?.stamp)
    signatureRuns.push(
      new ImageRun({
        data: dataUrlToUint8Array(documentData.images.stamp),
        transformation: { width: 90, height: 70 },
        type: imageType(documentData.images.stamp),
      }),
    );
  if (signatureRuns.length)
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 300 },
        children: signatureRuns,
      }),
    );

  const headerChildren = documentData.images?.logo
    ? [
        new Paragraph({
          children: [
            new ImageRun({
              data: dataUrlToUint8Array(documentData.images.logo),
              transformation: { width: 100, height: 36 },
              type: imageType(documentData.images.logo),
            }),
          ],
        }),
      ]
    : [
        new Paragraph({
          children: [
            new TextRun({
              text: "DOKUMENT AI",
              bold: true,
              color: "2563EB",
              size: 18,
              font: "Arial",
            }),
          ],
        }),
      ];

  const output = new Document({
    creator: "Dokument AI",
    title: documentData.title,
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 21, color: "0F172A" },
          paragraph: { spacing: { after: 120, line: 280 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
              header: 720,
              footer: 720,
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
                    text: "Dokument AI  |  ",
                    color: "64748B",
                    size: 16,
                    font: "Arial",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: "64748B",
                    size: 16,
                    font: "Arial",
                  }),
                  new TextRun({
                    text: " / ",
                    color: "64748B",
                    size: 16,
                    font: "Arial",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    color: "64748B",
                    size: 16,
                    font: "Arial",
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
  anchor.download = safeDocumentFilename(documentData, "docx");
  anchor.click();
  URL.revokeObjectURL(url);
}
