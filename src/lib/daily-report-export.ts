import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  calculateDailyStats,
  dailySectionLabels,
  type DailySectionId,
} from "@/lib/daily-report";
import {
  formatDocumentDate,
  safeDocumentFilename,
  type GeneratedDocument,
} from "@/lib/generated-document";
export async function downloadDailyReportPdf(document: GeneratedDocument) {
  const data = document.dailyReport!,
    stats = calculateDailyStats(data);
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const configured = pdfMake as typeof pdfMake & {
    vfs: Record<string, string>;
  };
  configured.vfs = pdfFonts as unknown as Record<string, string>;
  const content: Content[] = [
    {
      columns: [
        {
          stack: [
            {
              text: "DNEVNI IZVJEŠTAJ SA GRADILIŠTA",
              bold: true,
              fontSize: 16,
            },
            { text: data.projectName, bold: true, fontSize: 12 },
            {
              text: `${data.siteName} · ${data.siteAddress}`,
              color: "#64748b",
            },
          ],
        },
        {
          stack: [
            { text: data.number, bold: true, alignment: "right" },
            {
              text: `${formatDocumentDate(data.date, "hr")} · ${data.day}`,
              alignment: "right",
            },
            { text: data.status, alignment: "right", color: "#2563eb" },
          ],
        },
      ],
      columnGap: 20,
    },
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [
            ...[
              `Radnika: ${stats.workers}`,
              `Radnih sati: ${stats.workHours}`,
              `Radova: ${stats.completedWorks}`,
              `Problema: ${stats.openProblems}`,
            ].map((text) => ({
              text,
              bold: true,
              alignment: "center" as const,
              fillColor: "#f1f5f9",
              margin: [3, 6] as [number, number],
            })),
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 10, 0, 8],
    },
  ];
  for (const id of Object.keys(dailySectionLabels) as DailySectionId[]) {
    if (id === "photos") continue;
    const values = data.sections[id].filter((value) => value.visible);
    if (!values.length) continue;
    content.push(
      {
        text: dailySectionLabels[id].toUpperCase(),
        bold: true,
        color: "#1e3a8a",
        margin: [0, 8, 0, 4],
      },
      {
        table: {
          headerRows: 1,
          widths: [110, "*"],
          body: [
            [
              {
                text: "Zapis",
                bold: true,
                color: "#fff",
                fillColor: "#1e293b",
              },
              {
                text: "Detalji",
                bold: true,
                color: "#fff",
                fillColor: "#1e293b",
              },
            ],
            ...values.map((value) => [
              value.title,
              Object.entries(value.fields)
                .filter(([, field]) => String(field))
                .map(([key, field]) => `${key}: ${String(field)}`)
                .join(" · "),
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    );
  }
  for (const photo of data.photos.filter((value) => value.visible))
    content.push({
      stack: [
        { image: photo.dataUrl, fit: [480, 280], alignment: "center" },
        { text: photo.title, bold: true, margin: [0, 3, 0, 0] },
        {
          text: [photo.description, photo.location].filter(Boolean).join(" · "),
          color: "#64748b",
        },
      ],
      margin: [0, 10, 0, 0],
      unbreakable: true,
    });
  if (data.showSafetyDisclaimer)
    content.push({
      text: data.safetyDisclaimer,
      bold: true,
      color: "#92400e",
      fillColor: "#fffbeb",
      margin: [0, 10, 0, 0],
    });
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [38, 42, 38, 45],
    content,
    defaultStyle: { font: "Roboto", fontSize: 8.5 },
    footer: (page, pages) => ({
      columns: [
        {
          text: data.projectName || "Dnevni izvještaj",
          fontSize: 7,
          color: "#64748b",
        },
        {
          text: `Stranica ${page} / ${pages}`,
          alignment: "right",
          fontSize: 7,
          color: "#64748b",
        },
      ],
      margin: [38, 16, 38, 0],
    }),
    info: {
      title: `Dnevni izvještaj ${data.number}`,
      creator: data.mainContractor || "Dokument AI",
    },
  };
  configured
    .createPdf(definition)
    .download(safeDocumentFilename(document, "pdf"));
}
function bytes(value: string) {
  const binary = atob(value.split(",")[1] ?? "");
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function imageType(value: string): "jpg" | "png" {
  return value.startsWith("data:image/jpeg") ? "jpg" : "png";
}
export async function downloadDailyReportDocx(document: GeneratedDocument) {
  const data = document.dailyReport!,
    stats = calculateDailyStats(data),
    d = await import("docx");
  const {
    AlignmentType,
    Document,
    Footer,
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
      spacing: { after: 60 },
    });
  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = [
    new Paragraph({
      children: [
        new TextRun({
          text: "DNEVNI IZVJEŠTAJ SA GRADILIŠTA",
          bold: true,
          font: "Arial",
          size: 32,
        }),
      ],
    }),
    p(
      `${data.projectName}\n${data.siteName} · ${data.siteAddress}\n${data.number} · ${formatDocumentDate(data.date, "hr")} · ${data.status}`,
      true,
    ),
    p(
      `Radnika: ${stats.workers} · Radnih sati: ${stats.workHours} · Radova: ${stats.completedWorks} · Otvorenih problema: ${stats.openProblems}`,
      true,
    ),
  ];
  for (const id of Object.keys(dailySectionLabels) as DailySectionId[]) {
    if (id === "photos") continue;
    const values = data.sections[id].filter((value) => value.visible);
    if (!values.length) continue;
    children.push(
      p(dailySectionLabels[id].toUpperCase(), true),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({
            tableHeader: true,
            children: ["Zapis", "Detalji"].map(
              (label) =>
                new TableCell({
                  shading: { fill: "1E293B" },
                  children: [p(label, true)],
                }),
            ),
          }),
          ...values.map(
            (value) =>
              new TableRow({
                children: [
                  value.title,
                  Object.entries(value.fields)
                    .filter(([, field]) => String(field))
                    .map(([key, field]) => `${key}: ${String(field)}`)
                    .join(" · "),
                ].map((text) => new TableCell({ children: [p(text)] })),
              }),
          ),
        ],
      }),
    );
  }
  for (const photo of data.photos.filter((value) => value.visible))
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: bytes(photo.dataUrl),
            transformation: { width: 500, height: 300 },
            type: imageType(photo.dataUrl),
          }),
        ],
      }),
      p(`${photo.title}\n${photo.description} ${photo.location}`, true),
    );
  if (data.showSafetyDisclaimer) children.push(p(data.safetyDisclaimer, true));
  const output = new Document({
    creator: data.mainContractor || "Dokument AI",
    title: `Dnevni izvještaj ${data.number}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 800,
              right: 720,
              bottom: 800,
              left: 720,
              footer: 400,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${data.projectName} · Stranica `,
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
  const blob = await Packer.toBlob(output),
    url = URL.createObjectURL(blob),
    anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = safeDocumentFilename(document, "docx");
  anchor.click();
  URL.revokeObjectURL(url);
}
