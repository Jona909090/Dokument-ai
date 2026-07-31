import { LocalDocumentEditor } from "@/components/documents/local-document-editor";
export default async function Page({ params }: PageProps<"/documents/[id]">) { const { id } = await params; return <LocalDocumentEditor id={id} />; }
