"use client";
import { Check, Clipboard, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "number";
  multiline?: boolean;
  required?: boolean;
  wide?: boolean;
};

type FormFieldProps = FieldDefinition & {
  value: string;
  onChange: (value: string) => void;
};

export function FormField({ name, label, placeholder, type, multiline, required, wide, value, onChange }: FormFieldProps) {
  const id = `field-${name}`;
  const missing = required && !value.trim();
  function quickDate(days:number){const date=new Date();date.setDate(date.getDate()+days);onChange(date.toISOString().slice(0,10));}
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={id} className="text-sm font-semibold text-foreground">{label}{required && <span className="ml-1 text-red-500" aria-label="obavezno">*</span>}</label><span className="flex items-center gap-1">{value&&<Check className="size-3.5 text-emerald-600" aria-label="popunjeno"/>}<button type="button" disabled={!value} onClick={()=>void navigator.clipboard?.writeText(value)} className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={`Kopiraj ${label}`}><Clipboard className="size-3.5"/></button><button type="button" disabled={!value} onClick={()=>onChange("")} className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={`Očisti ${label}`}><RotateCcw className="size-3.5"/></button></span></div>
      {multiline ? (
        <Textarea id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-h-28" />
      ) : (
        <div className="relative"><Input id={id} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} aria-invalid={missing} className={missing?"border-red-400 focus-visible:ring-red-300":""}/>{type==="number"&&<div className="absolute right-1 top-1 flex h-8 overflow-hidden rounded-lg border bg-background"><button type="button" onClick={()=>onChange(String(Number(value||0)-1))} className="w-8 hover:bg-muted" aria-label={`Smanji ${label}`}>−</button><button type="button" onClick={()=>onChange(String(Number(value||0)+1))} className="w-8 border-l hover:bg-muted" aria-label={`Povećaj ${label}`}>+</button></div>}</div>
      )}
      {type==="date"&&<div className="mt-2 flex flex-wrap gap-1"><button type="button" onClick={()=>quickDate(0)} className="rounded-md bg-muted px-2 py-1 text-[11px]">Danas</button><button type="button" onClick={()=>quickDate(1)} className="rounded-md bg-muted px-2 py-1 text-[11px]">Sutra</button><button type="button" onClick={()=>quickDate(7)} className="rounded-md bg-muted px-2 py-1 text-[11px]">Za 7 dana</button></div>}
      {missing&&<p className="mt-1 text-xs text-red-600" role="alert">Ovo polje je obavezno.</p>}
    </div>
  );
}
