"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "./hero-section";
import { PopularDocuments } from "./popular-documents";
import { CompactSummary } from "./compact-summary";
import { confidenceRange, discoverDocuments } from "@/lib/landing-discovery";
import type { DocumentType } from "@/lib/document-types";
import { trackLandingEvent } from "@/lib/analytics/service";

export function LandingPage() {
  const router = useRouter(); const [request,setRequest]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [started,setStarted]=useState(false);
  const suggestions=useMemo(()=>discoverDocuments(request),[request]);
  function change(value:string){setRequest(value);setError("");if(!started&&value.trim()){setStarted(true);trackLandingEvent("smart_prompt_started");}if(value.trim().length>1&&discoverDocuments(value).length)trackLandingEvent("document_suggestion_shown",{documentType:discoverDocuments(value)[0].type,confidence:confidenceRange(discoverDocuments(value)[0].confidence)});}
  function open(type:DocumentType,source:"suggestion"|"quick"|"manual"){if(source==="suggestion")trackLandingEvent("document_suggestion_selected",{documentType:type,confidence:suggestions[0]?confidenceRange(suggestions[0].confidence):undefined});else if(source==="quick")trackLandingEvent("quick_action_selected",{documentType:type});else trackLandingEvent("manual_document_selected",{documentType:type});setLoading(true);router.push(`/wizard?type=${type}${request.trim()?`&prompt=${encodeURIComponent(request.trim())}`:""}`);}
  function submit(){if(!suggestions.length){setError("Nismo dovoljno sigurni koji dokument trebate. Odaberite dokument među karticama ispod ili preciznije opišite zahtjev.");trackLandingEvent("hero_prompt_submitted",{success:false});return;}trackLandingEvent("hero_prompt_submitted",{documentType:suggestions[0].type,confidence:confidenceRange(suggestions[0].confidence),success:true});open(suggestions[0].type,"suggestion");}
  return <><HeroSection value={request} onValueChange={change} onSubmit={submit} onOpen={(type,source)=>open(type,source)} suggestions={suggestions} loading={loading} error={error}/><CompactSummary/><PopularDocuments onOpen={(type)=>open(type,"manual")}/></>;
}
