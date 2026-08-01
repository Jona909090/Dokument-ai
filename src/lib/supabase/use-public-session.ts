"use client";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "./config";
import { createClient } from "./client";
export type PublicSession={authenticated:boolean;name:string;email:string};
export function usePublicSession(){const[session,setSession]=useState<PublicSession>({authenticated:false,name:"",email:""});useEffect(()=>{if(!isSupabaseConfigured())return;const supabase=createClient();void supabase.auth.getUser().then(({data})=>{if(!data.user)return;const metadata=data.user.user_metadata as{first_name?:string;display_name?:string}|undefined;setSession({authenticated:true,name:metadata?.first_name??metadata?.display_name?.split(" ")[0]??"",email:data.user.email??""})});const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,userSession)=>{const user=userSession?.user;if(!user){setSession({authenticated:false,name:"",email:""});return}const metadata=user.user_metadata as{first_name?:string;display_name?:string}|undefined;setSession({authenticated:true,name:metadata?.first_name??metadata?.display_name?.split(" ")[0]??"",email:user.email??""})});return()=>subscription.unsubscribe()},[]);return session;}
