export default function PdfVisualEditor() {
  return (
    <section className="w-full px-4 pb-8 sm:px-8">
      <div className="w-full rounded-3xl border bg-card p-5 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">PDF editor</h2>
        <p className="mb-4 text-sm text-muted-foreground">Dodavanje teksta, crtanje, highlight, zoom, undo/redo i lokalno uređivanje PDF-a.</p>
        <iframe
          src="/document-ai-pdf-editor.html"
          title="PDF editor"
          className="h-[900px] w-full rounded-2xl border bg-background"
        />
      </div>
    </section>
  );
}
