import { AICopilot } from "@/components/ai/ai-copilot";
export default async function CopilotPage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) { const { prompt = "" } = await searchParams; return <main className="min-h-screen bg-muted/20"><AICopilot initialPrompt={prompt} /></main>; }

