"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ArrowLeft, Barcode, Combine, Download, Eraser, FileSignature, FileText, FileType2, FileUp, QrCode, ScanText, Signature, Stamp } from "lucide-react";

function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") return resolve();
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Ne mogu učitati ${id}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error(`Ne mogu učitati ${id}`));
    document.head.appendChild(script);
  });
}

export default function DocumentToolsPage() {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [qrText, setQrText] = useState("https://dokument-ai-kohl.vercel.app/");
  const [qrUrl, setQrUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [status, setStatus] = useState("");
  const [watermark, setWatermark] = useState("DOKUMENT AI");
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState("hrv");
  const [docxTemplate, setDocxTemplate] = useState<File | null>(null);
  const [docxData, setDocxData] = useState('{"ime":"Stefan","firma":"Dokument AI","datum":"16.08.2026"}');
  const [barcodeValue, setBarcodeValue] = useState("DOKUMENT-AI-001");

  useEffect(() => {
    void loadScript("jsbarcode", "https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js");
  }, []);

  async function generateQr(value = qrText) {
    if (!value.trim()) return;
    setQrText(value);
    setQrUrl(await QRCode.toDataURL(value, { width: 360, margin: 2, errorCorrectionLevel: "M" }));
  }

  function downloadSignature() {
    const signature = signatureRef.current;
    if (!signature || signature.isEmpty()) {
      setStatus("Prvo nacrtajte potpis.");
      return;
    }
    const link = document.createElement("a");
    link.href = signature.getTrimmedCanvas().toDataURL("image/png");
    link.download = "potpis.png";
    link.click();
    setStatus("Potpis je spremljen kao PNG.");
  }

  async function addDocumentMark(file: File) {
    setPdfName(file.name);
    setStatus("Dodajem oznaku i brojeve stranica…");
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    pages.forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(`${watermark || "Dokument AI"} • ${index + 1}/${pages.length}`, {
        x: Math.max(24, width - 190), y: 18, size: 8, font, color: rgb(0.35, 0.35, 0.4),
      });
    });
    downloadBytes(await pdf.save(), file.name.replace(/\.pdf$/i, "") + "-oznacen.pdf");
    setStatus("PDF je označen i preuzet.");
  }

  async function mergePdfs(files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length < 2) {
      setStatus("Za spajanje odaberite najmanje dva PDF-a.");
      return;
    }
    setStatus(`Spajam ${selected.length} PDF dokumenta…`);
    const output = await PDFDocument.create();
    for (const file of selected) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach(page => output.addPage(page));
    }
    downloadBytes(await output.save(), "dokument-ai-spojeni.pdf");
    setStatus("PDF dokumenti su spojeni.");
  }

  async function signPdf(file: File) {
    const signature = signatureRef.current;
    if (!signature || signature.isEmpty()) {
      setStatus("Prvo nacrtajte potpis u alatu Digitalni potpis.");
      return;
    }
    setStatus("Ugrađujem potpis u PDF…");
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pngDataUrl = signature.getTrimmedCanvas().toDataURL("image/png");
    const pngBytes = await fetch(pngDataUrl).then(response => response.arrayBuffer());
    const image = await pdf.embedPng(pngBytes);
    const page = pdf.getPages()[pdf.getPageCount() - 1];
    const { width } = page.getSize();
    const targetWidth = 150;
    const targetHeight = targetWidth * (image.height / image.width);
    page.drawImage(image, { x: Math.max(35, width - targetWidth - 40), y: 45, width: targetWidth, height: targetHeight });
    downloadBytes(await pdf.save(), file.name.replace(/\.pdf$/i, "") + "-potpisan.pdf");
    setStatus("Potpis je dodat na zadnju stranicu PDF-a.");
  }

  async function runOcr(file: File) {
    setOcrText("");
    setOcrProgress(0);
    setStatus("OCR učitavanje…");
    await loadScript("tesseract-js", "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
    const api = (window as unknown as { Tesseract?: { recognize: (image: File, lang: string, options: { logger: (message: { status?: string; progress?: number }) => void }) => Promise<{ data: { text: string } }> } }).Tesseract;
    if (!api) throw new Error("Tesseract OCR nije učitan.");
    const result = await api.recognize(file, ocrLanguage, { logger: message => { if (typeof message.progress === "number") setOcrProgress(Math.round(message.progress * 100)); } });
    setOcrText(result.data.text.trim());
    setStatus("OCR je završio.");
  }

  async function generateDocxFromTemplate() {
    if (!docxTemplate) { setStatus("Prvo odaberite DOCX predložak."); return; }
    setStatus("Popunjavam DOCX predložak…");
    await loadScript("pizzip", "https://cdn.jsdelivr.net/npm/pizzip@3.1.8/dist/pizzip.min.js");
    await loadScript("docxtemplater", "https://cdn.jsdelivr.net/npm/docxtemplater@3.67.5/build/docxtemplater.js");
    const globals = window as unknown as { PizZip?: new (data: ArrayBuffer) => { generate: (options: { type: "blob"; mimeType: string; compression: "DEFLATE" }) => Blob }; docxtemplater?: new (zip: unknown, options: { paragraphLoop: boolean; linebreaks: boolean }) => { render: (data: Record<string, unknown>) => void; getZip: () => { generate: (options: { type: "blob"; mimeType: string; compression: "DEFLATE" }) => Blob } } };
    if (!globals.PizZip || !globals.docxtemplater) throw new Error("DOCX alat nije učitan.");
    const data = JSON.parse(docxData) as Record<string, unknown>;
    const zip = new globals.PizZip(await docxTemplate.arrayBuffer());
    const doc = new globals.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    const blob = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = docxTemplate.name.replace(/\.docx$/i, "") + "-popunjen.docx";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("DOCX predložak je popunjen.");
  }

  async function generateBarcode() {
    await loadScript("jsbarcode", "https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js");
    const JsBarcode = (window as unknown as { JsBarcode?: (target: SVGSVGElement, value: string, options: Record<string, unknown>) => void }).JsBarcode;
    if (!JsBarcode || !barcodeRef.current) throw new Error("Barcode alat nije učitan.");
    JsBarcode(barcodeRef.current, barcodeValue || "DOKUMENT-AI", { format: "CODE128", displayValue: true, margin: 10, height: 72 });
    setStatus("Barkod je generiran.");
  }

  function downloadBarcode() {
    const svg = barcodeRef.current;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dokument-ai-barcode.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="flex size-10 items-center justify-center rounded-xl border" aria-label="Nazad"><ArrowLeft className="size-4" /></Link>
          <div><h1 className="text-2xl font-bold">Alati za dokumente</h1><p className="text-sm text-muted-foreground">Gotovi alati dostupni u Dokument AI.</p></div>
        </div>
        {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><QrCode className="size-5"/><h2 className="font-semibold">QR kod</h2></div>
            <textarea value={qrText} onChange={(e)=>setQrText(e.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm" placeholder="Tekst, poveznica, kontakt, Wi-Fi…" />
            <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>void generateQr()}>Generiraj QR</button><button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("mailto:")}>Email</button><button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("tel:")}>Telefon</button><button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("WIFI:T:WPA;S:Naziv mreže;P:Lozinka;;")}>Wi-Fi</button></div>
            {qrUrl && <div className="mt-4"><img src={qrUrl} alt="Generirani QR kod" className="mx-auto size-52 rounded-xl bg-white p-2"/><a href={qrUrl} download="dokument-ai-qr.png" className="mt-3 block text-center text-sm font-semibold text-primary">Preuzmi QR</a></div>}
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><ScanText className="size-5"/><h2 className="font-semibold">OCR skeniranje</h2></div>
            <div className="mb-3 flex gap-2"><select value={ocrLanguage} onChange={e=>setOcrLanguage(e.target.value)} className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm"><option value="hrv">Hrvatski</option><option value="srp">Srpski</option><option value="eng">English</option><option value="deu">Deutsch</option></select><span className="flex h-10 items-center rounded-xl border px-3 text-xs">{ocrProgress}%</span></div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center hover:bg-muted"><ScanText className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi sliku dokumenta</span><input type="file" accept="image/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void runOcr(file).catch(error=>setStatus(error instanceof Error?error.message:"OCR greška"))}}/></label>
            {ocrText && <><textarea readOnly value={ocrText} className="mt-3 min-h-40 w-full rounded-xl border bg-background p-3 text-sm"/><button className="mt-2 rounded-xl border px-3 py-2 text-sm" onClick={()=>void navigator.clipboard.writeText(ocrText)}>Kopiraj tekst</button></>}
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><FileType2 className="size-5"/><h2 className="font-semibold">DOCX predložak</h2></div>
            <p className="mb-3 text-sm text-muted-foreground">U Word predlošku koristi polja poput {'{ime}'}, {'{firma}'}, {'{datum}'}.</p>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-4 text-sm font-semibold hover:bg-muted"><FileText className="mr-2 size-4"/>{docxTemplate?.name||"Odaberi .docx predložak"}<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={e=>setDocxTemplate(e.target.files?.[0]||null)}/></label>
            <textarea value={docxData} onChange={e=>setDocxData(e.target.value)} className="mt-3 min-h-32 w-full rounded-xl border bg-background p-3 font-mono text-xs"/>
            <button className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>void generateDocxFromTemplate().catch(error=>setStatus(error instanceof Error?error.message:"DOCX greška"))}>Popuni i preuzmi DOCX</button>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Barcode className="size-5"/><h2 className="font-semibold">Barkod generator</h2></div>
            <input value={barcodeValue} onChange={e=>setBarcodeValue(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Vrijednost barkoda"/>
            <div className="mt-3 overflow-x-auto rounded-xl bg-white p-3"><svg ref={barcodeRef}/></div>
            <div className="mt-3 flex gap-2"><button className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>void generateBarcode().catch(error=>setStatus(error instanceof Error?error.message:"Barcode greška"))}>Generiraj</button><button className="rounded-xl border px-3 py-2 text-sm" onClick={downloadBarcode}>Preuzmi SVG</button></div>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Signature className="size-5"/><h2 className="font-semibold">Digitalni potpis</h2></div>
            <div className="overflow-hidden rounded-2xl border bg-white"><SignatureCanvas ref={signatureRef} penColor="black" canvasProps={{ width: 520, height: 220, className: "h-52 w-full" }} /></div>
            <div className="mt-4 flex gap-2"><button className="rounded-xl border px-3 py-2 text-sm" onClick={() => signatureRef.current?.clear()}><Eraser className="mr-2 inline size-4"/>Obriši</button><button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={downloadSignature}><Download className="mr-2 inline size-4"/>Spremi potpis</button></div>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><FileSignature className="size-5"/><h2 className="font-semibold">Potpiši PDF</h2></div>
            <p className="mb-4 text-sm text-muted-foreground">Nacrtaj potpis, zatim odaberi PDF.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><FileUp className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi PDF za potpis</span><input type="file" accept="application/pdf" className="hidden" onChange={(e)=>{const file=e.target.files?.[0];if(file)void signPdf(file)}}/></label>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Combine className="size-5"/><h2 className="font-semibold">Spoji PDF</h2></div>
            <p className="mb-4 text-sm text-muted-foreground">Odaberi dva ili više PDF dokumenta.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><Combine className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi više PDF-ova</span><input type="file" multiple accept="application/pdf" className="hidden" onChange={(e)=>{if(e.target.files)void mergePdfs(e.target.files)}}/></label>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Stamp className="size-5"/><h2 className="font-semibold">Oznaka + broj stranice</h2></div>
            <input value={watermark} onChange={e=>setWatermark(e.target.value)} className="mb-3 h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Tekst oznake"/>
            <p className="mb-4 text-sm text-muted-foreground">Dodaje oznaku i broj stranice.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><FileUp className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi PDF</span><input type="file" accept="application/pdf" className="hidden" onChange={(e)=>{const file=e.target.files?.[0]; if(file) void addDocumentMark(file)}}/></label>
            {pdfName && <p className="mt-3 truncate text-xs text-muted-foreground">{pdfName}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
