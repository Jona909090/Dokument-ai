import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { isProjectSection } from "@/lib/projects";
export default async function ProjectSectionPage({ params }: { params: Promise<{ id: string; section: string }> }) { const { id, section } = await params; if (!isProjectSection(section)) notFound(); return <ProjectWorkspace projectId={id} section={section} />; }
