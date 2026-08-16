import PdfExtraTools from "@/components/document-tools/PdfExtraTools";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="[&_.grid]:grid-cols-1">{children}</div>
      <PdfExtraTools />
    </>
  );
}
