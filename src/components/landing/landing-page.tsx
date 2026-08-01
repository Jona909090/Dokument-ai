"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "./hero-section";
import { PopularDocuments } from "./popular-documents";
import { CompactSummary } from "./compact-summary";
import { confidenceRange, discoverDocuments } from "@/lib/landing-discovery";
import type { DocumentType } from "@/lib/document-types";
import { trackLandingEvent } from "@/lib/analytics/service";
import { saveAIHandoff } from "@/lib/ai/handoff";
import type { AICopilotResult } from "@/lib/ai/types";

export function LandingPage() {
  const router = useRouter(); const [request,setRequest]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [started,setStarted]=useState(false); const [aiConnected,setAIConnected]=useState<boolean|null>(null);
  const suggestions=useMemo(()=>discoverDocuments(request),[request]);
  useEffect(()=>{const controller=new AbortController();fetch("/api/ai/status",{signal:controller.signal,cache:"no-store"}).then(response=>response.ok?response.json():null).then(status=>setAIConnected(Boolean(status?.connected))).catch(()=>setAIConnected(false));return()=>controller.abort()},[]);
  function change(value:string){setRequest(value);setError("");if(!started&&value.trim()){setStarted(true);trackLandingEvent("smart_prompt_started");}const discovered=discoverDocuments(value);if(value.trim().length>1&&discovered.length)trackLandingEvent("document_suggestion_shown",{documentType:discovered[0].type,confidence:confidenceRange(discovered[0].confidence)});}
  function open(type:DocumentType,source:"suggestion"|"quick"|"manual"){if(source==="suggestion")trackLandingEvent("document_suggestion_selected",{documentType:type,confidence:suggestions[0]?confidenceRange(suggestions[0].confidence):undefined});else if(source==="quick")trackLandingEvent("quick_action_selected",{documentType:type});else trackLandingEvent("manual_document_selected",{documentType:type});setLoading(true);router.push(`/wizard?type=${type}${request.trim()?`&prompt=${encodeURIComponent(request.trim())}`:""}`);}
  async function submit(){const prompt=request.trim();if(prompt.length<3){setError("Opišite dokument koji želite napraviti.");return;}setLoading(true);setError("");try{const response=await fetch("/api/ai/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,action:"draft",idempotencyKey:crypto.randomUUID(),context:{privacy:{allowCompany:false,allowContact:false,allowDocument:false,allowPreferences:false}}})});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"AI trenutno nije dostupan.");const result=data as AICopilotResult;if(result.classification.documentType==="unknown"){setError(result.classification.clarificationReason||"Dodajte još detalja kako bismo prepoznali pravi dokument.");trackLandingEvent("hero_prompt_submitted",{success:false});return;}saveAIHandoff(prompt,result);trackLandingEvent("hero_prompt_submitted",{documentType:result.classification.documentType,confidence:confidenceRange(result.classification.confidence),success:true});router.push(`/wizard?type=${result.classification.documentType}&source=ai&requestId=${encodeURIComponent(result.requestId)}&prompt=${encodeURIComponent(prompt)}`);}catch(caught){if(suggestions[0]){open(suggestions[0].type,"suggestion");return;}setError(caught instanceof Error?caught.message:"AI trenutno nije dostupan. Pokušajte ponovno.");trackLandingEvent("hero_prompt_submitted",{success:false});}finally{setLoading(false);}}
  return <><HeroSection value={request} onValueChange={change} onSubmit={()=>void submit()} onOpen={(type,source)=>open(type,source)} suggestions={suggestions} loading={loading} error={error} aiConnected={aiConnected}/><CompactSummary/><PopularDocuments onOpen={(type)=>open(type,"manual")}/></>;
}
