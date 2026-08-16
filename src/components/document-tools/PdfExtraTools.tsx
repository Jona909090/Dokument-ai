"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";

function download(bytes: Uint8Array, name: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const card = "rounded-3xl border bg-card p-5 shadow-sm";
const upload = "mt-3 block w-full cursor-pointer rounded-xl border border-dashed p-4 text-sm";
const field = "mt-3 w-full rounded-xl border p-3 text-sm";

export default function PdfExtraTools() {
  const [status, setStatus] = useState("");
  const [pages, setPages] = useState("1");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [pageNumber, setPageNumber] = useState("1");
  const [targetPage, setTargetPage] = useState("1");
  const [margin, setMargin] = useState("20");
  const [stampImage, setStampImage] = useState<File | null>(null);
  const [metadataInfo, setMetadataInfo] = useState("");
  const [formInfo, setFormInfo] = useState("");

  async function splitPdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    for (let i = 0; i < src.getPageCount(); i++) {
      const out = await PDFDocument.create();
      const [page] = await out.copyPages(src, [i]);
      out.addPage(page);
      download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-stranica-${i + 1}.pdf`);
    }
    setStatus(`Razdvojeno ${src.getPageCount()} stranica.`);
  }

  async function extractPages(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const indexes = pages.split(",").map(v => Number(v.trim()) - 1).filter(v => Number.isInteger(v) && v >= 0 && v < src.getPageCount());
    if (!indexes.length) return setStatus("Unesi ispravne brojeve stranica, npr. 1,3,5.");
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indexes);
    copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-izdvojeno.pdf`);
    setStatus("Stranice izdvojene.");
  }

  async function deletePages(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const indexes = pages.split(",").map(v => Number(v.trim()) - 1).filter(v => Number.isInteger(v) && v >= 0 && v < pdf.getPageCount()).sort((a,b)=>b-a);
    indexes.forEach(i => pdf.removePage(i));
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-bez-stranica.pdf`);
    setStatus("Odabrane stranice obrisane.");
  }

  async function rotatePdf(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    pdf.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + 90) % 360)));
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-rotiran.pdf`);
    setStatus("Sve stranice rotirane 90°.");
  }

  async function reversePdf(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const out = await PDFDocument.create();
    const idx = src.getPageIndices().reverse();
    const copied = await out.copyPages(src, idx);
    copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-obrnuti-redosled.pdf`);
    setStatus("Redosled stranica obrnut.");
  }

  async function addBlank(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const last = pdf.getPages().at(-1);
    const size = last ? last.getSize() : { width: 595, height: 842 };
    pdf.addPage([size.width, size.height]);
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-prazna-stranica.pdf`);
    setStatus("Prazna stranica dodata.");
  }

  async function metadata(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    if (title.trim()) pdf.setTitle(title.trim());
    if (author.trim()) pdf.setAuthor(author.trim());
    pdf.setModificationDate(new Date());
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-metadata.pdf`);
    setStatus("Metadata spremljena.");
  }

  async function attachFile(pdfFile: File) {
    if (!attachment) return setStatus("Prvo odaberi datoteku za prilog.");
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer());
    await pdf.attach(await attachment.arrayBuffer(), attachment.name, { mimeType: attachment.type || "application/octet-stream", modificationDate: new Date() });
    download(await pdf.save(), `${pdfFile.name.replace(/\.pdf$/i, "")}-sa-prilogom.pdf`);
    setStatus("Datoteka dodata kao PDF prilog.");
  }

  async function flattenForm(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    pdf.getForm().flatten();
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-flatten.pdf`);
    setStatus("PDF forma zaključana/flattened.");
  }

  async function duplicatePage(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const index = Number(pageNumber) - 1;
    if (index < 0 || index >= src.getPageCount()) return setStatus("Neispravan broj stranice.");
    const out = await PDFDocument.create();
    const order = src.getPageIndices().flatMap(i => i === index ? [i, i] : [i]);
    const copied = await out.copyPages(src, order);
    copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-duplirana-stranica.pdf`);
    setStatus("Stranica duplirana.");
  }

  async function movePage(file: File) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const from = Number(pageNumber) - 1;
    const to = Number(targetPage) - 1;
    if (from < 0 || from >= src.getPageCount() || to < 0 || to >= src.getPageCount()) return setStatus("Neispravan broj stranice.");
    const order = src.getPageIndices();
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, order);
    copied.forEach(p => out.addPage(p));
    download(await out.save(), `${file.name.replace(/\.pdf$/i, "")}-premestena-stranica.pdf`);
    setStatus("Stranica premještena.");
  }

  async function cropPdf(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const m = Math.max(0, Number(margin) || 0);
    pdf.getPages().forEach(page => {
      const { width, height } = page.getSize();
      const crop = Math.min(m, width / 2 - 1, height / 2 - 1);
      page.setCropBox(crop, crop, width - crop * 2, height - crop * 2);
    });
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-crop.pdf`);
    setStatus("Margine su odrezane.");
  }

  async function resizeA4(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const a4w = 595.28;
    const a4h = 841.89;
    pdf.getPages().forEach(page => {
      const { width, height } = page.getSize();
      page.scaleContent(a4w / width, a4h / height);
      page.setSize(a4w, a4h);
    });
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-a4.pdf`);
    setStatus("Sve stranice pretvorene na A4.");
  }

  async function imagesToPdf(files: FileList) {
    const selected = Array.from(files);
    if (!selected.length) return;
    const pdf = await PDFDocument.create();
    for (const file of selected) {
      const bytes = await file.arrayBuffer();
      const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    download(await pdf.save(), "slike-u-pdf.pdf");
    setStatus(`${selected.length} slika pretvoreno u PDF.`);
  }

  async function addImageStamp(pdfFile: File) {
    if (!stampImage) return setStatus("Prvo odaberi PNG ili JPG sliku.");
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer());
    const bytes = await stampImage.arrayBuffer();
    const image = stampImage.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.getPages()[0];
    const { width, height } = page.getSize();
    const targetWidth = Math.min(160, width * 0.25);
    const targetHeight = targetWidth * image.height / image.width;
    page.drawImage(image, { x: width - targetWidth - 30, y: height - targetHeight - 30, width: targetWidth, height: targetHeight });
    download(await pdf.save(), `${pdfFile.name.replace(/\.pdf$/i, "")}-slika.pdf`);
    setStatus("Slika dodata na prvu stranicu.");
  }

  async function clearMetadata(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    pdf.setTitle("");
    pdf.setAuthor("");
    pdf.setSubject("");
    pdf.setKeywords([]);
    pdf.setCreator("");
    pdf.setProducer("");
    download(await pdf.save(), `${file.name.replace(/\.pdf$/i, "")}-bez-metadata.pdf`);
    setStatus("Metadata uklonjena.");
  }

  async function readMetadata(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    setMetadataInfo([
      `Naslov: ${pdf.getTitle() || "-"}`,
      `Autor: ${pdf.getAuthor() || "-"}`,
      `Predmet: ${pdf.getSubject() || "-"}`,
      `Ključne riječi: ${pdf.getKeywords() || "-"}`,
      `Creator: ${pdf.getCreator() || "-"}`,
      `Producer: ${pdf.getProducer() || "-"}`,
      `Stranice: ${pdf.getPageCount()}`,
    ].join("\n"));
    setStatus("Metadata očitana.");
  }

  async function inspectForm(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const fields = pdf.getForm().getFields();
    setFormInfo(fields.length ? fields.map((f, i) => `${i + 1}. ${f.getName()} (${f.constructor.name})`).join("\n") : "PDF nema interaktivna polja forme.");
    setStatus("Polja forme očitana.");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-8">
      <h2 className="mb-5 text-2xl font-bold">Dodatni PDF alati</h2>
      {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
      <div className="space-y-5">
        <section className={card}><h3 className="font-semibold">Razdvoji PDF</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void splitPdf(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Izdvoji stranice</h3><input value={pages} onChange={e=>setPages(e.target.value)} className={field} placeholder="1,3,5"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void extractPages(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Obriši stranice</h3><input value={pages} onChange={e=>setPages(e.target.value)} className={field} placeholder="2,4"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void deletePages(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Rotiraj PDF 90°</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void rotatePdf(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Obrni redosled stranica</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void reversePdf(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Dodaj praznu stranicu</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void addBlank(f)}}/></section>
        <section className={card}><h3 className="font-semibold">PDF metadata</h3><input value={title} onChange={e=>setTitle(e.target.value)} className={field} placeholder="Naslov"/><input value={author} onChange={e=>setAuthor(e.target.value)} className={field} placeholder="Autor"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void metadata(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Dodaj datoteku u PDF</h3><input className={upload} type="file" onChange={e=>setAttachment(e.target.files?.[0]||null)}/><p className="mt-2 text-xs text-muted-foreground">Prilog: {attachment?.name || "nije odabran"}</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void attachFile(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Zaključaj PDF formu</h3><p className="mt-2 text-sm text-muted-foreground">Flatten pretvara popunjena polja forme u stalni sadržaj.</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void flattenForm(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Dupliraj stranicu</h3><input value={pageNumber} onChange={e=>setPageNumber(e.target.value)} className={field} placeholder="Broj stranice"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void duplicatePage(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Premjesti stranicu</h3><div className="grid gap-2 sm:grid-cols-2"><input value={pageNumber} onChange={e=>setPageNumber(e.target.value)} className={field} placeholder="Sa stranice"/><input value={targetPage} onChange={e=>setTargetPage(e.target.value)} className={field} placeholder="Na poziciju"/></div><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void movePage(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Odreži margine</h3><input value={margin} onChange={e=>setMargin(e.target.value)} className={field} placeholder="Margina u PDF točkama"/><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void cropPdf(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Pretvori stranice na A4</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void resizeA4(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Slike u PDF</h3><input className={upload} type="file" multiple accept="image/png,image/jpeg" onChange={e=>{if(e.target.files)void imagesToPdf(e.target.files)}}/></section>
        <section className={card}><h3 className="font-semibold">Dodaj sliku na PDF</h3><input className={upload} type="file" accept="image/png,image/jpeg" onChange={e=>setStampImage(e.target.files?.[0]||null)}/><p className="mt-2 text-xs text-muted-foreground">Slika: {stampImage?.name || "nije odabrana"}</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void addImageStamp(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Ukloni PDF metadata</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void clearMetadata(f)}}/></section>
        <section className={card}><h3 className="font-semibold">Pregled PDF metadata</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void readMetadata(f)}}/>{metadataInfo && <pre className="mt-3 whitespace-pre-wrap rounded-xl border p-3 text-xs">{metadataInfo}</pre>}</section>
        <section className={card}><h3 className="font-semibold">Pregled polja PDF forme</h3><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void inspectForm(f)}}/>{formInfo && <pre className="mt-3 whitespace-pre-wrap rounded-xl border p-3 text-xs">{formInfo}</pre>}</section>
      </div>
    </section>
  );
}
