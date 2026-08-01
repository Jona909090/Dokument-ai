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
import { downloadCompletedWorksReportDocx, downloadCompletedWorksReportPdf } from "@/lib/completed-works-report-export";
import { downloadWorkHandoverDocx, downloadWorkHandoverPdf } from "@/lib/work-handover-export";
import { migrateDocumentStyle, paperSupportsPdf, type DocumentStyleConfig } from "@/lib/document-design";
import type { ContentBlock } from "@/lib/composer";

const euro = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
});
function pdfPaperBackground(style:DocumentStyleConfig,pageSize:{width:number;height:number}):Content{const paper=style.paper,canvas:Array<Record<string,unknown>>=[{type:"rect",x:0,y:0,w:pageSize.width,h:pageSize.height,color:paper.printSafe.blackAndWhitePreview?"#ffffff":paper.color.value}];if(paper.pattern.enabled&&paperSupportsPdf(paper.pattern.type)){const color=paper.printSafe.enabled?"#e2e8f0":paper.pattern.color,step=Math.max(10,paper.pattern.spacing*2.835),opacity=paper.printSafe.enabled?Math.min(.05,paper.pattern.opacity):paper.pattern.opacity;if(["horizontal-lines","technical-grid","construction-grid","blueprint"].includes(paper.pattern.type))for(let y=0;y<pageSize.height;y+=step)canvas.push({type:"line",x1:0,y1:y,x2:pageSize.width,y2:y,lineWidth:paper.pattern.lineWidth,lineColor:color,opacity});if(["vertical-lines","technical-grid","construction-grid","blueprint"].includes(paper.pattern.type))for(let x=0;x<pageSize.width;x+=step)canvas.push({type:"line",x1:x,y1:0,x2:x,y2:pageSize.height,lineWidth:paper.pattern.lineWidth,lineColor:color,opacity});if(paper.pattern.type==="page-frame")canvas.push({type:"rect",x:18,y:18,w:pageSize.width-36,h:pageSize.height-36,lineColor:color,lineWidth:1,opacity});}for(const line of paper.lines.filter(v=>v.enabled)){const c=line.color,w=line.thickness,o=paper.printSafe.enabled?Math.min(.25,line.opacity):line.opacity;if(line.position==="top")canvas.push({type:"rect",x:0,y:0,w:pageSize.width,h:w,color:c,opacity:o});if(line.position==="bottom")canvas.push({type:"rect",x:0,y:pageSize.height-w,w:pageSize.width,h:w,color:c,opacity:o});if(line.position==="left")canvas.push({type:"rect",x:0,y:0,w,h:pageSize.height,color:c,opacity:o});if(line.position==="right")canvas.push({type:"rect",x:pageSize.width-w,y:0,w,h:pageSize.height,color:c,opacity:o});}return{canvas:canvas as never};}
function pdfBlock(block:ContentBlock,style:DocumentStyleConfig):Content[]{const c=block.content,text=String(c.text??c.value??"");const margin:[number,number,number,number]=[0,block.style.padding/2,0,block.style.padding/2];if(block.type==="document-title")return[{text,bold:true,fontSize:24,color:style.headingColor,margin,pageBreak:block.pageBehavior.startOnNewPage?"before":undefined}];if(block.type==="subtitle")return[{text,bold:true,fontSize:15,color:style.accentColor,margin}];if(["text","rich-text","terms","note","warning","legal","custom"].includes(block.type))return[{stack:[...(c.title?[{text:String(c.title),bold:true,color:style.headingColor,margin:[0,0,0,4]as [number,number,number,number]}]:[]),{text,fontSize:style.fontSize,color:block.style.textColor??style.textColor}],margin,unbreakable:block.pageBehavior.keepTogether}];if(block.type==="field-value")return[{stack:[{text:String(c.label??""),bold:true,fontSize:8,color:style.mutedColor},{text,fontSize:style.fontSize}],margin}];if(block.type==="divider")return[{canvas:[{type:"line",x1:0,y1:0,x2:475,y2:0,lineColor:style.accentColor,lineWidth:1}],margin}];if(block.type==="spacer")return[{text:"",margin:[0,0,0,Number(c.height??20)]}];if(block.type==="items-table"||block.type==="table"){const columns=c.columns as string[]??[],rows=c.rows as unknown[][]??[];return[{table:{headerRows:1,widths:columns.map(()=>"*"),body:[columns.map(v=>({text:v,bold:true,color:"#ffffff",fillColor:style.accentColor})),...rows.map(row=>row.map(v=>String(v)))]},layout:"lightHorizontalLines",margin}]}if(block.type==="financial-summary"||block.type==="stat-card"||block.type==="status")return[{table:{widths:["*"],body:[[{stack:[{text:String(c.label??c.title??block.name),fontSize:8,color:style.mutedColor},{text:text||String(c.total??""),bold:true,fontSize:16,color:style.accentColor}],fillColor:style.surfaceColor,margin:8}]]},layout:"noBorders",margin}];return[{text:`${block.name}${text?`: ${text}`:""}`,margin,color:style.textColor}];}

function displayValue(
  value: string,
  type: "date" | "multiline" | undefined,
  locale: GeneratedDocument["locale"],
) {
  return type === "date" ? formatDocumentDate(value, locale) : value;
}

export async function downloadPdf(document: GeneratedDocument) {
  document = buildVisibleDocumentModel(document);
  const styleConfig = migrateDocumentStyle(document.style, document.type);
  if (!document.composer && document.workHandover) return downloadWorkHandoverPdf(document);
  if (!document.composer && document.completedWorksReport) return downloadCompletedWorksReportPdf(document);
  if (!document.composer && document.dailyReport) return downloadDailyReportPdf(document);
  if (!document.composer && document.invoice) return downloadInvoicePdf(document);
  if (!document.composer && document.quotation) return downloadQuotationPdf(document);
  if (!document.composer && document.purchaseOrder) return downloadPurchaseOrderPdf(document);
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

  const content: Content[] = document.composer ? document.composer.blocks.filter(v=>v.visible).flatMap(v=>pdfBlock(v,styleConfig)) : [
    { text: document.title, style: "title" },
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

  if (!document.composer && document.items?.length) {
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
              fillColor: styleConfig.accentColor,
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

  if (!document.composer && document.totals) {
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
              color: styleConfig.accentColor,
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
    pageSize: styleConfig.page.size,
    pageOrientation: styleConfig.page.orientation,
    pageMargins: [styleConfig.page.margins.left*2.835, styleConfig.page.margins.top*2.835+34, styleConfig.page.margins.right*2.835, styleConfig.page.margins.bottom*2.835+24],
    background: (_currentPage,pageSize)=>pdfPaperBackground(styleConfig,pageSize),
    header: {
      columns: [
        document.images?.logo
          ? { image: document.images.logo, fit: [90, 32] }
          : { text: document.title, bold: true, color: styleConfig.accentColor, fontSize: 10 },
        {
          text: document.title,
          alignment: "right",
          color: "#64748b",
          fontSize: 8,
        },
      ],
      margin: [styleConfig.page.margins.left*2.835, 22, styleConfig.page.margins.right*2.835, 0],
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: document.title, color: styleConfig.mutedColor, fontSize: 8 },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          color: "#64748b",
          fontSize: 8,
        },
      ],
      margin: [styleConfig.page.margins.left*2.835, 14, styleConfig.page.margins.right*2.835, 0],
    }),
    content,
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.25 },
    styles: {
      title: {
        fontSize: 24,
        bold: true,
        color: styleConfig.headingColor,
        margin: [0, 4, 0, 6],
      },
      subtitle: { fontSize: 10, color: "#64748b", margin: [0, 0, 0, 18] },
      section: { fontSize: 14, bold: true, color: styleConfig.accentColor },
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
  const styleConfig = migrateDocumentStyle(documentData.style, documentData.type);
  if (!documentData.composer && documentData.workHandover) return downloadWorkHandoverDocx(documentData);
  if (!documentData.composer && documentData.completedWorksReport) return downloadCompletedWorksReportDocx(documentData);
  if (!documentData.composer && documentData.dailyReport) return downloadDailyReportDocx(documentData);
  if (!documentData.composer && documentData.invoice) return downloadInvoiceDocx(documentData);
  if (!documentData.composer && documentData.quotation) return downloadQuotationDocx(documentData);
  if (!documentData.composer && documentData.purchaseOrder)
    return downloadPurchaseOrderDocx(documentData);
  const docx = await import("docx");
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
  } = docx;

  function renderComposerBlock(block:ContentBlock):Array<InstanceType<typeof Paragraph>|InstanceType<typeof Table>>{
    const c=block.content,text=String(c.text??c.value??"");
    if(block.type==="items-table"||block.type==="table"){
      const columns=(c.columns as string[]|undefined)??[],rows=(c.rows as unknown[][]|undefined)??[];
      const header=new TableRow({tableHeader:true,children:columns.map(value=>new TableCell({children:[new Paragraph({children:[new TextRun({text:value,bold:true,color:"FFFFFF",font:styleConfig.tableFont})]})],shading:{fill:styleConfig.accentColor.slice(1)}}))});
      const body=rows.map(row=>new TableRow({children:row.map(value=>new TableCell({children:[new Paragraph({children:[new TextRun({text:String(value),font:styleConfig.tableFont})]})]}))}));
      return[new Table({width:{size:9360,type:WidthType.DXA},rows:[header,...body]})];
    }
    const isTitle=block.type==="document-title",isSubtitle=block.type==="subtitle",label=block.type==="field-value"?`${String(c.label??"")}: `:"";
    return[new Paragraph({pageBreakBefore:block.pageBehavior.startOnNewPage,keepNext:block.pageBehavior.keepWithNext,keepLines:block.pageBehavior.keepTogether,spacing:{before:block.style.padding*10,after:block.style.padding*10},children:[new TextRun({text:`${label}${text||String(c.total??c.title??block.name)}`,bold:isTitle||isSubtitle||["financial-summary","stat-card","status"].includes(block.type),size:isTitle?40:isSubtitle?28:Math.round(styleConfig.fontSize*2),color:(isTitle?styleConfig.headingColor:block.style.textColor??styleConfig.textColor).slice(1),font:isTitle||isSubtitle?styleConfig.headingFont:styleConfig.bodyFont})]})];
  }

  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = [
    new Paragraph({
      children: [
        new TextRun({
          text: documentData.title,
          bold: true,
          size: 40,
          color: styleConfig.headingColor.slice(1),
          font: styleConfig.headingFont,
        }),
      ],
      spacing: { after: 120 },
    }),
  ];

  if(documentData.composer){children.splice(0,children.length,...documentData.composer.blocks.filter(v=>v.visible).flatMap(renderComposerBlock));}

  for (const field of documentData.composer?[]:documentData.fields) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: field.label.toUpperCase(),
            bold: true,
            size: 16,
            color: styleConfig.mutedColor.slice(1),
            font: styleConfig.smallFont,
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
            color: styleConfig.textColor.slice(1),
            font: styleConfig.bodyFont,
          }),
        ],
        spacing: { after: 120, line: 280 },
      }),
    );
  }

  if (!documentData.composer && documentData.items?.length) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: documentData.locale === "hr" ? "Stavke" : "Items",
            bold: true,
            size: 28,
            color: styleConfig.accentColor.slice(1),
            font: styleConfig.headingFont,
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
              shading: { fill: styleConfig.accentColor.slice(1) },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: true,
                      color: "FFFFFF",
                      font: styleConfig.tableFont,
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
                        new TextRun({ text, size: 18, font: styleConfig.tableFont }),
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

  if (!documentData.composer && documentData.totals) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 240, after: 60 },
        children: [
          new TextRun({
            text: `Ukupno bez PDV-a: ${euro.format(documentData.totals.subtotal)}`,
            font: styleConfig.bodyFont,
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
            font: styleConfig.bodyFont,
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
            color: styleConfig.accentColor.slice(1),
            size: 24,
            font: styleConfig.headingFont,
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
              text: documentData.title,
              bold: true,
              color: styleConfig.accentColor.slice(1),
              size: 18,
              font: styleConfig.headingFont,
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
          run: { font: styleConfig.bodyFont, size: Math.round(styleConfig.fontSize*2), color: styleConfig.textColor.slice(1) },
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
              top: Math.round(styleConfig.page.margins.top*56.7),
              right: Math.round(styleConfig.page.margins.right*56.7),
              bottom: Math.round(styleConfig.page.margins.bottom*56.7),
              left: Math.round(styleConfig.page.margins.left*56.7),
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
