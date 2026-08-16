"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const card = "rounded-3xl border bg-card p-5 shadow-sm";
const upload = "mt-3 block w-full cursor-pointer rounded-xl border border-dashed p-4 text-sm";

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function savePdf(bytes: Uint8Array, name: string) {
  saveBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), name);
}

export default function NewPublicTools() {
  const [status, setStatus] = useState("");
  const [html, setHtml] = useState("<h1>Dokument AI</h1><p>Unesite sadržaj dokumenta.</p>");
  const [text, setText] = useState("");

  async function imagesToPdf(files: FileList) {
    const pdf = await PDFDocument.create();
    for (const file of Array.from(files)) {
      const bytes = await file.arrayBuffer();
      const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([595.28, 841.89]);
      const maxW = 535, maxH = 782;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale, h = image.height * scale;
      page.drawImage(image, { x: (595.28-w)/2, y: (841.89-h)/2, width:w, height:h });
    }
    savePdf(await pdf.save(), "slike-u-pdf.pdf");
    setStatus("Slike su pretvorene u PDF.");
  }

  async function textToPdf() {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const lines = text.split(/\n/);
    let page = pdf.addPage([595.28,841.89]); let y=800;
    for (const raw of lines) {
      const chunks = raw.match(/.{1,85}(?:\s|$)|.{1,85}/g) || [""];
      for (const line of chunks) {
        if (y < 45) { page=pdf.addPage([595.28,841.89]); y=800; }
        page.drawText(line.trim(), {x:40,y,size:11,font,color:rgb(0,0,0)}); y-=16;
      }
    }
    savePdf(await pdf.save(), "tekst-u-pdf.pdf"); setStatus("Tekst je pretvoren u PDF.");
  }

  function htmlToDocx() {
    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    saveBlob(new Blob([full], {type:"application/msword"}), "html-dokument.doc");
    setStatus("HTML dokument je spremljen kao Word kompatibilan dokument.");
  }

  function markdownToHtml() {
    const escaped = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const converted = escaped
      .replace(/^### (.*)$/gm,"<h3>$1</h3>")
      .replace(/^## (.*)$/gm,"<h2>$1</h2>")
      .replace(/^# (.*)$/gm,"<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.*?)\*/g,"<em>$1</em>")
      .replace(/\n/g,"<br>");
    saveBlob(new Blob([`<!doctype html><meta charset="utf-8"><body>${converted}</body>`],{type:"text/html"}),"markdown.html");
    setStatus("Markdown je pretvoren u HTML.");
  }

  async function pdfInfo(file: File) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const info = [
      `Datoteka: ${file.name}`,
      `Veličina: ${(file.size/1024).toFixed(1)} KB`,
      `Broj stranica: ${pdf.getPageCount()}`,
      `Naslov: ${pdf.getTitle() || "-"}`,
      `Autor: ${pdf.getAuthor() || "-"}`,
      `Predmet: ${pdf.getSubject() || "-"}`,
      `Kreator: ${pdf.getCreator() || "-"}`,
      `Producent: ${pdf.getProducer() || "-"}`
    ].join("\n");
    setText(info); setStatus("PDF informacije su očitane.");
  }

  return <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-8">
    {status && <div className="mb-5 rounded-xl border bg-card p-3 text-sm">{status}</div>}
    <div className="space-y-5">
      <section className={card}><h3 className="font-semibold">Slike u PDF</h3><p className="mt-2 text-sm text-muted-foreground">JPEG/PNG slike pretvara u višestranični PDF.</p><input className={upload} multiple type="file" accept="image/jpeg,image/png" onChange={e=>{if(e.target.files?.length)void imagesToPdf(e.target.files)}}/></section>
      <section className={card}><h3 className="font-semibold">Tekst u PDF</h3><textarea value={text} onChange={e=>setText(e.target.value)} className="mt-3 min-h-40 w-full rounded-xl border bg-background p-3 text-sm" placeholder="Unesite tekst..."/><button onClick={()=>void textToPdf()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Preuzmi PDF</button></section>
      <section className={card}><h3 className="font-semibold">HTML u Word dokument</h3><textarea value={html} onChange={e=>setHtml(e.target.value)} className="mt-3 min-h-40 w-full rounded-xl border bg-background p-3 font-mono text-xs"/><button onClick={htmlToDocx} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Preuzmi Word</button></section>
      <section className={card}><h3 className="font-semibold">Markdown u HTML</h3><textarea value={text} onChange={e=>setText(e.target.value)} className="mt-3 min-h-40 w-full rounded-xl border bg-background p-3 text-sm" placeholder="# Naslov"/><button onClick={markdownToHtml} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Preuzmi HTML</button></section>
      <section className={card}><h3 className="font-semibold">PDF informacije</h3><p className="mt-2 text-sm text-muted-foreground">Čita broj stranica i osnovne metapodatke dokumenta.</p><input className={upload} type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void pdfInfo(f)}}/></section>
    </div>
  </section>;
}
