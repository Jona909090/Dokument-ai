import PdfExtraTools from "@/components/document-tools/PdfExtraTools";
import NewPublicTools from "@/components/document-tools/NewPublicTools";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="[&_.grid]:grid-cols-1">{children}</div>
      <div className="w-full [&>section]:!w-full [&>section]:!max-w-none [&>section]:px-4 sm:[&>section]:px-8 [&_section]:!w-full">
        <PdfExtraTools />
      </div>
      <div className="w-full [&>section]:!w-full [&>section]:!max-w-none [&>section]:px-4 sm:[&>section]:px-8 [&_section]:!w-full">
        <NewPublicTools />
      </div>
    </>
  );
}
