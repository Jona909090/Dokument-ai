import { redirect } from "next/navigation";
export default async function Page({ params }: PageProps<"/dashboard/documents/[id]">) { const { id } = await params; redirect(`/documents/${id}`); }
