"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ArrowLeft, Download, Eraser, FileUp, QrCode, Signature } from "lucide-react";

export default function DocumentToolsPage() {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [qrText, setQrText] = useState("https://dokument-ai-kohl.vercel.app/");
  const [qrUrl, setQrUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [status, setStatus] = useState("");

  async function generateQr() {
    if (!qrText.trim()) return;
    setQrUrl(await QRCode.toDataURL(qrText, { width: 320, margin: 2, errorCorrectionLevel: "M" }));
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
    setStatus("Potpis je spreman kao PNG.");
  }

  async function addDocumentMark(file: File) {
    setPdfName(file.name);
    setStatus("Obrađujem PDF…");
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    pages.forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(`Dokument AI • ${index + 1}/${pages.length}`, {
        x: Math.max(24, width - 155), y: 18, size: 8, font, color: rgb(0.35, 0.35, 0.4),
      });
    });
    const output = await pdf.save();
    const blob = new Blob([new Uint8Array(output)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name.replace(/\.pdf$/i, "") + "-dokument-ai.pdf";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("PDF je obrađen i preuzet.");
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="flex size-10 items-center justify-center rounded-xl border"><ArrowLeft className="size-4" /></Link>
          <div><h1 className="text-2xl font-bold">Alati za dokumente</h1><p className="text-sm text-muted-foreground">Potpis, QR i PDF alati — prva integraciona grupa.</p></div>
        </div>
        {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Signature className="size-5"/><h2 className="font-semibold">Digitalni potpis</h2></div>
            <div className="overflow-hidden rounded-2xl border bg-white"><SignatureCanvas ref={signatureRef} penColor="black" canvasProps={{ width: 520, height: 220, className: "h-52 w-full" }} /></div>
            <div className="mt-4 flex gap-2"><button className="rounded-xl border px-3 py-2 text-sm" onClick={() => signatureRef.current?.clear()}><Eraser className="mr-2 inline size-4"/>Obriši</button><button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={downloadSignature}><Download className="mr-2 inline size-4"/>Spremi potpis</button></div>
          </section>
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><QrCode className="size-5"/><h2 className="font-semibold">QR kod</h2></div>
            <textarea value={qrText} onChange={(e)=>setQrText(e.target.value)} className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm" placeholder="Tekst ili poveznica" />
            <button className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={generateQr}>Generiraj QR</button>
            {qrUrl && <div className="mt-4"><img src={qrUrl} alt="Generirani QR kod" className="mx-auto size-48 rounded-xl bg-white p-2"/><a href={qrUrl} download="dokument-ai-qr.png" className="mt-3 block text-center text-sm font-semibold text-primary">Preuzmi QR</a></div>}
          </section>
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><FileUp className="size-5"/><h2 className="font-semibold">PDF alat</h2></div>
            <p className="mb-4 text-sm text-muted-foreground">Učitaj postojeći PDF. Alat dodaje diskretnu oznaku Dokument AI i broj stranice na svaku stranicu.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hover:bg-muted"><FileUp className="mb-3 size-8"/><span className="text-sm font-semibold">Odaberi PDF</span><input type="file" accept="application/pdf" className="hidden" onChange={(e)=>{const file=e.target.files?.[0]; if(file) void addDocumentMark(file)}}/></label>
            {pdfName && <p className="mt-3 truncate text-xs text-muted-foreground">{pdfName}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
