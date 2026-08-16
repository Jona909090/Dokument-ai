"use client";

import Link from "next/link";
import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";

function download(bytes: Uint8Array, name: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

const card = "rounded-3xl border bg-card p-5 shadow-sm";
const upload = "mt-3 block w-full cursor-pointer rounded-xl border border-dashed p-4 text-sm";

export default function PdfExtraTools() {
  const [status, setStatus] = useState("");
  const [pages, setPages] = useState("1");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  async function splitPdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    for (let i = 0; i < src.getPageCount(); i++) {
      const out = await PDFDocument.create();
      const [page] = await out.copyPages(src, [i]); out.addPage(page);
      download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-stranica-${i + 1}.pdf`);
    }
    setStatus(`Razdvojeno ${src.getPageCount()} stranica.`);
  }

  async function extractPages(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const indexes = pages.split(",").map(v => Number(v.trim()) - 1).filter(v => Number.isInteger(v) && v >= 0 && v < src.getPageCount());
    if (!indexes.length) return setStatus("Unesi ispravne brojeve stranica, npr. 1,3,5.");
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indexes); copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-izdvojeno.pdf`); setStatus("Stranice izdvojene.");
  }

  async function deletePages(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const indexes = pages.split(",").map(v => Number(v.trim()) - 1).filter(v => Number.isInteger(v) && v >= 0 && v < pdf.getPageCount()).sort((a,b)=>b-a);
    indexes.forEach(i => pdf.removePage(i));
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-bez-stranica.pdf`); setStatus("Odabrane stranice obrisane.");
  }

  async function rotatePdf(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    pdf.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + 90) % 360)));
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-rotiran.pdf`); setStatus("Sve stranice rotirane 90°.");
  }

  async function reversePdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const out = await PDFDocument.create();
    const idx = src.getPageIndices().reverse();
    const copied = await out.copyPages(src, idx); copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-obrnuti-redosled.pdf`); setStatus("Redosled stranica obrnut.");
  }

  async function addBlank(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const last = pdf.getPages().at(-1); const size = last ? last.getSize() : { width: 595, height: 842 };
    pdf.addPage([size.width, size.height]);
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-prazna-stranica.pdf`); setStatus("Prazna stranica dodata.");
  }

  async function metadata(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    if (title.trim()) pdf.setTitle(title.trim()); if (author.trim()) pdf.setAuthor(author.trim());
    pdf.setModificationDate(new Date());
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-metadata.pdf`); setStatus("Metadata spremljena.");
  }

  async function attachFile(pdfFile: File) {
    if (!attachment) return setStatus("Prvo odaberi datoteku za prilog.");
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer());
    await pdf.attach(await attachment.arrayBuffer(), attachment.name, { mimeType: attachment.type || "application/octet-stream", modificationDate: new Date() });
    download(await pdf.save(), `${pdfFile.name.replace(/\.pdf$/i, "")}-sa-prilogom.pdf`); setStatus("Datoteka dodata kao PDF prilog.");
  }

  async function flattenForm(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    pdf.getForm().flatten();
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-flatten.pdf`); setStatus("PDF forma zaključana/flattened.");
  }

  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <div className="mb-6"><Link href="/tools" className="text-sm font-semibold">← Alati za dokumente</Link><h1 className="mt-2 text-2xl font-bold">Dodatni PDF alati</h1></div>
    {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <section className={card}><h2 className="font-semibold">Razdvoji PDF</h2><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void splitPdf(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Izdvoji stranice</h2><input value={pages} onChange={e=>setPages(e.target.value)} className="mt-3 w-full rounded-xl border p-3 text-sm" placeholder="1,3,5"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void extractPages(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Obriši stranice</h2><input value={pages} onChange={e=>setPages(e.target.value)} className="mt-3 w-full rounded-xl border p-3 text-sm" placeholder="2,4"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void deletePages(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Rotiraj PDF 90°</h2><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void rotatePdf(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Obrni redosled stranica</h2><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void reversePdf(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Dodaj praznu stranicu</h2><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void addBlank(f)}}/></section>
      <section className={card}><h2 className="font-semibold">PDF metadata</h2><input value={title} onChange={e=>setTitle(e.target.value)} className="mt-3 w-full rounded-xl border p-3 text-sm" placeholder="Naslov"/><input value={author} onChange={e=>setAuthor(e.target.value)} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Autor"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void metadata(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Dodaj datoteku u PDF</h2><input className={upload} type="file" onChange={e=>setAttachment(e.target.files?.[0]||null)}/><p className="mt-2 text-xs text-muted-foreground">Prilog: {attachment?.name || "nije odabran"}</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void attachFile(f)}}/></section>
      <section className={card}><h2 className="font-semibold">Zaključaj PDF formu</h2><p className="mt-2 text-sm text-muted-foreground">Flatten pretvara popunjena polja forme u stalni sadržaj.</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void flattenForm(f)}}/></section>
    </div>
  </div></main>;
}
