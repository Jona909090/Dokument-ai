import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { calculatePurchaseOrderItem, calculatePurchaseOrderTotals, type PurchaseOrderData, type PurchaseOrderParty } from "@/lib/purchase-order";
import { formatDocumentDate, safeDocumentFilename, type GeneratedDocument } from "@/lib/generated-document";

function money(value: number, currency: string) { try { return new Intl.NumberFormat("hr-HR", { style: "currency", currency: currency || "EUR" }).format(value); } catch { return `${value.toFixed(2)} ${currency}`; } }
function partyText(party: PurchaseOrderParty) { return [party.name, party.address, party.cityPostalCode, party.taxNumber && `OIB / PIB: ${party.taxNumber}`, party.contactPerson && `Kontakt: ${party.contactPerson}`, [party.phone, party.email].filter(Boolean).join(" · ")].filter(Boolean).join("\n"); }
function metadata(data: PurchaseOrderData) { return [["Željena isporuka", formatDocumentDate(data.desiredDeliveryDate, "hr")], ["Mjesto isporuke", data.deliveryPlace], ["Način isporuke", data.deliveryMethod], ["Rok plaćanja", data.paymentDeadline], ["Način plaćanja", data.paymentMethod], ["Referenca ponude", data.offerReference], ["Projekt / gradilište", data.project], ["Odgovorna osoba", data.responsiblePerson]].filter(([, value]) => value); }

export async function downloadPurchaseOrderPdf(document: GeneratedDocument) {
  const data = document.purchaseOrder!;
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const configured = pdfMake as typeof pdfMake & { vfs: Record<string, string> }; configured.vfs = pdfFonts as unknown as Record<string, string>;
  const totals = calculatePurchaseOrderTotals(data.items);
  const header = data.showPrices ? ["R.br.", "Naziv / opis", "Kol.", "JM", "Cijena", "Popust", "PDV", "Iznos"] : ["R.br.", "Naziv / opis", "Kol.", "JM"];
  const widths = data.showPrices ? [25, "*", 34, 28, 58, 38, 30, 65] : [30, "*", 55, 45];
  const rows: Content[][] = data.items.map((item, index) => { const amount = calculatePurchaseOrderItem(item); const description: Content = item.description ? { stack: [{ text: item.name || "—", bold: true }, { text: item.description, color: "#64748b", fontSize: 7 }] } : { text: item.name || "—", bold: true }; const base: Content[] = [String(index + 1), description, String(item.quantity), item.unit]; return data.showPrices ? [...base, money(item.unitPrice, data.currency), `${item.discountRate}%`, `${item.taxRate}%`, money(amount.total, data.currency)] : base; });
  const content: Content[] = [
    { columns: [{ stack: document.images?.logo ? [{ image: document.images.logo, fit: [95, 38] }, { text: partyText(data.buyer), margin: [0, 4, 0, 0] }] : [{ text: partyText(data.buyer), bold: true }] }, { stack: [{ text: "NARUDŽBENICA", fontSize: 22, bold: true, alignment: "right" }, { text: `Br. ${data.orderNumber || "—"}`, bold: true, alignment: "right", margin: [0, 4, 0, 0] }, { text: `${formatDocumentDate(data.issueDate, "hr")}${data.issuePlace ? ` · ${data.issuePlace}` : ""}`, alignment: "right" }] }], columnGap: 20 },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: "#0f172a" }], margin: [0, 10, 0, 10] },
    { columns: [{ stack: [{ text: "DOBAVLJAČ", bold: true, fontSize: 8, margin: [0, 0, 0, 4] }, { text: partyText(data.supplier) }] }, { stack: [{ text: "ISPORUKA I PLAĆANJE", bold: true, fontSize: 8, margin: [0, 0, 0, 4] }, ...metadata(data).map(([label, value]) => ({ text: [{ text: `${label}: `, color: "#64748b" }, String(value)] }))] }], columnGap: 20, margin: [0, 0, 0, 12] },
    { table: { headerRows: 1, widths, body: [header.map((text): Content => ({ text, bold: true, color: "#ffffff", fillColor: "#1e293b", margin: [2, 4] })), ...rows] }, layout: { hLineColor: () => "#cbd5e1", vLineColor: () => "#e2e8f0", paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 5, paddingBottom: () => 5 } },
  ];
  if (data.showPrices) content.push({ table: { widths: [110, 90], body: [["Ukupno bez PDV-a", money(totals.gross, data.currency)], ["Popust", `− ${money(totals.discount, data.currency)}`], ["Porezna osnovica", money(totals.subtotal, data.currency)], ["PDV", money(totals.tax, data.currency)], [{ text: "Ukupno s PDV-om", bold: true }, { text: money(totals.total, data.currency), bold: true }]] }, layout: "lightHorizontalLines", margin: [315, 12, 0, 0] });
  for (const [title, value] of [["NAPOMENA", data.note], ["UVJETI ISPORUKE", data.deliveryTerms], ["UVJETI PLAĆANJA", data.paymentTerms]]) if (value) content.push({ stack: [{ text: title, bold: true, fontSize: 8 }, { text: value, margin: [0, 3, 0, 0] }], margin: [0, 10, 0, 0], unbreakable: true });
  const pdfSignatureCells: Content[] = [["NARUČIO", data.orderedBy], ["ODOBRIO", data.approvedBy], ["DOBAVLJAČ / POTVRDA PRIMITKA", data.supplierConfirmation]].map(([title, value]): Content => { const entry = value as PurchaseOrderData["orderedBy"]; return { stack: [{ text: title as string, bold: true, alignment: "center" }, { text: entry.name, alignment: "center", margin: [0, 20, 0, 0] }, { text: entry.role, alignment: "center", color: "#64748b" }, { text: formatDocumentDate(entry.date, "hr"), alignment: "center" }] }; });
  content.push({ table: { widths: ["*", "*", "*"], dontBreakRows: true, body: [pdfSignatureCells] }, layout: { hLineWidth: (index) => index === 0 ? 1 : 0, vLineWidth: () => 0 }, margin: [0, 22, 0, 0] });
  const approvalImages: Content[] = [];
  if (document.images?.signature) approvalImages.push({ image: document.images.signature, fit: [95, 38], alignment: "right" });
  if (document.images?.stamp) approvalImages.push({ image: document.images.stamp, fit: [65, 48], alignment: "right" });
  if (approvalImages.length) content.push({ columns: [{ text: "" }, ...approvalImages], columnGap: 10, margin: [0, 8, 0, 0], unbreakable: true });
  const definition: TDocumentDefinitions = { pageSize: "A4", pageMargins: [40, 45, 40, 45], content, defaultStyle: { font: "Roboto", fontSize: 8.5, lineHeight: 1.15 }, footer: (page, pages) => ({ columns: [{ text: data.buyer.name || "Narudžbenica", color: "#64748b", fontSize: 7 }, { text: `Stranica ${page} / ${pages}`, alignment: "right", color: "#64748b", fontSize: 7 }], margin: [40, 16, 40, 0] }), info: { title: `Narudžbenica ${data.orderNumber}`, creator: data.buyer.name || "Dokument AI" } };
  configured.createPdf(definition).download(safeDocumentFilename(document, "pdf"));
}

function dataUrl(dataUrl: string) { const binary = atob(dataUrl.split(",")[1] ?? ""); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); }
function imageType(value: string): "jpg" | "png" { return value.startsWith("data:image/jpeg") ? "jpg" : "png"; }

export async function downloadPurchaseOrderDocx(document: GeneratedDocument) {
  const data = document.purchaseOrder!; const totals = calculatePurchaseOrderTotals(data.items); const d = await import("docx");
  const { AlignmentType, BorderStyle, Document, Footer, Header, ImageRun, Packer, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = d;
  const p = (text: string, bold = false) => new Paragraph({ children: [new TextRun({ text, bold, font: "Arial", size: 18 })], spacing: { after: 50 } });
  const headerLabels = data.showPrices ? ["R.br.", "Naziv / opis", "Kol.", "JM", "Cijena", "Popust", "PDV", "Iznos"] : ["R.br.", "Naziv / opis", "Kol.", "JM"];
  const tableRows = [new TableRow({ tableHeader: true, children: headerLabels.map((label) => new TableCell({ shading: { fill: "1E293B" }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "FFFFFF", font: "Arial", size: 16 })] })] })) }), ...data.items.map((item, index) => { const amount = calculatePurchaseOrderItem(item); const values = [String(index + 1), [item.name, item.description].filter(Boolean).join("\n"), String(item.quantity), item.unit]; if (data.showPrices) values.push(money(item.unitPrice, data.currency), `${item.discountRate}%`, `${item.taxRate}%`, money(amount.total, data.currency)); return new TableRow({ children: values.map((value) => new TableCell({ children: value.split("\n").map((line) => p(line)) })) }); })];
  const titleTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 5000, type: WidthType.DXA }, children: [p(partyText(data.buyer), true)] }),
      new TableCell({ children: [
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "NARUDŽBENICA", bold: true, size: 36, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Br. ${data.orderNumber}\n${formatDocumentDate(data.issueDate, "hr")} ${data.issuePlace}`, font: "Arial", size: 18 })] }),
      ] }),
    ] })],
  });
  const partyTable = new Table({ width: { size: 9360, type: WidthType.DXA }, rows: [new TableRow({ children: [
    new TableCell({ children: [p("DOBAVLJAČ", true), p(partyText(data.supplier))] }),
    new TableCell({ children: [p("ISPORUKA I PLAĆANJE", true), ...metadata(data).map(([label, value]) => p(`${label}: ${value}`))] }),
  ] })] });
  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [
    titleTable,
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "0F172A" } }, spacing: { after: 160 } }),
    partyTable,
    new Paragraph({ spacing: { after: 120 } }),
    new Table({ width: { size: 9360, type: WidthType.DXA }, rows: tableRows }),
  ];
  if (data.showPrices) children.push(p(`Ukupno bez PDV-a: ${money(totals.gross, data.currency)}\nPopust: ${money(totals.discount, data.currency)}\nPorezna osnovica: ${money(totals.subtotal, data.currency)}\nPDV: ${money(totals.tax, data.currency)}\nUKUPNO S PDV-om: ${money(totals.total, data.currency)}`, true));
  for (const [title, value] of [["NAPOMENA", data.note], ["UVJETI ISPORUKE", data.deliveryTerms], ["UVJETI PLAĆANJA", data.paymentTerms]]) if (value) children.push(p(`${title}\n${value}`, true));
  const signatureCells = [["NARUČIO", data.orderedBy], ["ODOBRIO", data.approvedBy], ["DOBAVLJAČ / POTVRDA PRIMITKA", data.supplierConfirmation]].map(([title, value]) => {
    const entry = value as PurchaseOrderData["orderedBy"];
    return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 6, color: "64748B" } }, children: [new TextRun({ text: `${title}\n\n${entry.name}\n${entry.role}\n${formatDocumentDate(entry.date, "hr")}`, bold: true, font: "Arial", size: 16 })] })] });
  });
  children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, rows: [new TableRow({ children: signatureCells })] }));
  if (document.images?.signature || document.images?.stamp) children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [document.images.signature && new ImageRun({ data: dataUrl(document.images.signature), transformation: { width: 100, height: 40 }, type: imageType(document.images.signature) }), document.images.stamp && new ImageRun({ data: dataUrl(document.images.stamp), transformation: { width: 65, height: 48 }, type: imageType(document.images.stamp) })].filter(Boolean) as InstanceType<typeof ImageRun>[] }));
  const headerChildren = document.images?.logo ? [new Paragraph({ children: [new ImageRun({ data: dataUrl(document.images.logo), transformation: { width: 90, height: 32 }, type: imageType(document.images.logo) })] })] : [new Paragraph("")];
  const output = new Document({ creator: data.buyer.name || "Dokument AI", title: `Narudžbenica ${data.orderNumber}`, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, right: 850, bottom: 900, left: 850, header: 450, footer: 450 } } }, headers: { default: new Header({ children: headerChildren }) }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Stranica ", font: "Arial", size: 15 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 15 }), new TextRun({ text: " / ", font: "Arial", size: 15 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 15 })] })] }) }, children }] });
  const blob = await Packer.toBlob(output); const url = URL.createObjectURL(blob); const anchor = globalThis.document.createElement("a"); anchor.href = url; anchor.download = safeDocumentFilename(document, "docx"); anchor.click(); URL.revokeObjectURL(url);
}
