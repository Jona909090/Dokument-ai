"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ArrowLeft, Combine, Download, Eraser, FileSignature, FileUp, QrCode, Signature, Stamp } from "lucide-react";

function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DocumentToolsPage() {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [qrText, setQrText] = useState("https://dokument-ai-kohl.vercel.app/");
  const [qrUrl, setQrUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [status, setStatus] = useState("");
  const [watermark, setWatermark] = useState("DOKUMENT AI");

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

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="flex size-10 items-center justify-center rounded-xl border" aria-label="Nazad"><ArrowLeft className="size-4" /></Link>
          <div><h1 className="text-2xl font-bold">Alati za dokumente</h1><p className="text-sm text-muted-foreground">QR, potpis i praktični PDF alati direktno u Dokument AI.</p></div>
        </div>
        {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><QrCode className="size-5"/><h2 className="font-semibold">QR kod</h2></div>
            <textarea value={qrText} onChange={(e)=>setQrText(e.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm" placeholder="Tekst, poveznica, kontakt, Wi-Fi…" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>void generateQr()}>Generiraj QR</button>
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("mailto:")}>Email</button>
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("tel:")}>Telefon</button>
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>void generateQr("WIFI:T:WPA;S:Naziv mreže;P:Lozinka;;")}>Wi-Fi</button>
            </div>
            {qrUrl && <div className="mt-4"><img src={qrUrl} alt="Generirani QR kod" className="mx-auto size-52 rounded-xl bg-white p-2"/><a href={qrUrl} download="dokument-ai-qr.png" className="mt-3 block text-center text-sm font-semibold text-primary">Preuzmi QR</a></div>}
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Signature className="size-5"/><h2 className="font-semibold">Digitalni potpis</h2></div>
            <div className="overflow-hidden rounded-2xl border bg-white"><SignatureCanvas ref={signatureRef} penColor="black" canvasProps={{ width: 520, height: 220, className: "h-52 w-full" }} /></div>
            <div className="mt-4 flex gap-2"><button className="rounded-xl border px-3 py-2 text-sm" onClick={() => signatureRef.current?.clear()}><Eraser className="mr-2 inline size-4"/>Obriši</button><button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={downloadSignature}><Download className="mr-2 inline size-4"/>Spremi potpis</button></div>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><FileSignature className="size-5"/><h2 className="font-semibold">Potpiši PDF</h2></div>
            <p className="mb-4 text-sm text-muted-foreground">Nacrtaj potpis lijevo, zatim odaberi PDF. Potpis se stavlja na zadnju stranicu.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><FileUp className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi PDF za potpis</span><input type="file" accept="application/pdf" className="hidden" onChange={(e)=>{const file=e.target.files?.[0];if(file)void signPdf(file)}}/></label>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Combine className="size-5"/><h2 className="font-semibold">Spoji PDF</h2></div>
            <p className="mb-4 text-sm text-muted-foreground">Odaberi dva ili više PDF dokumenta i dobit ćeš jedan spojeni PDF.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><Combine className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi više PDF-ova</span><input type="file" multiple accept="application/pdf" className="hidden" onChange={(e)=>{if(e.target.files)void mergePdfs(e.target.files)}}/></label>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Stamp className="size-5"/><h2 className="font-semibold">Oznaka + broj stranice</h2></div>
            <input value={watermark} onChange={e=>setWatermark(e.target.value)} className="mb-3 h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Tekst oznake"/>
            <p className="mb-4 text-sm text-muted-foreground">Dodaje diskretnu oznaku i automatski broj svake stranice.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><FileUp className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi PDF</span><input type="file" accept="application/pdf" className="hidden" onChange={(e)=>{const file=e.target.files?.[0]; if(file) void addDocumentMark(file)}}/></label>
            {pdfName && <p className="mt-3 truncate text-xs text-muted-foreground">{pdfName}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
