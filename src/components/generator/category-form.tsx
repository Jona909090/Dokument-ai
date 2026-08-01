"use client";

import { useEffect, useMemo, useState } from "react";
import { FormField, type FieldDefinition } from "@/components/generator/form-field";
import { Button } from "@/components/ui/button";
import { documentTypeDefinitions, type DocumentType } from "@/lib/document-types";
import type { DocumentLocale, GeneratedDocument } from "@/lib/generated-document";

const fieldsByType: Record<Exclude<DocumentType, "invoice" | "proforma" | "offer" | "daily-report" | "completed-works-report">, FieldDefinition[]> = {
  cv: [
    { name: "fullName", label: "Ime i prezime", required: true },
    { name: "title", label: "Profesionalni naslov", placeholder: "npr. Voditelj projekta", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Telefon", type: "tel", required: true },
    { name: "location", label: "Mjesto prebivališta" },
    { name: "linkedin", label: "LinkedIn ili web stranica" },
    { name: "summary", label: "Profesionalni sažetak", multiline: true, required: true, wide: true },
    { name: "experience", label: "Radno iskustvo", placeholder: "Pozicija, tvrtka, razdoblje i odgovornosti", multiline: true, required: true, wide: true },
    { name: "education", label: "Obrazovanje", multiline: true, required: true, wide: true },
    { name: "skills", label: "Vještine", placeholder: "Odvojite vještine zarezom", multiline: true, wide: true },
  ],
  contract: [
    { name: "contractType", label: "Vrsta ugovora", placeholder: "npr. Ugovor o radu", required: true, wide: true },
    { name: "partyOne", label: "Prva ugovorna strana", required: true },
    { name: "partyOneTaxId", label: "OIB / porezni broj prve strane" },
    { name: "partyTwo", label: "Druga ugovorna strana", required: true },
    { name: "partyTwoTaxId", label: "OIB / porezni broj druge strane" },
    { name: "subject", label: "Predmet ugovora", multiline: true, required: true, wide: true },
    { name: "startDate", label: "Datum početka", type: "date", required: true },
    { name: "endDate", label: "Datum završetka", type: "date" },
    { name: "compensation", label: "Naknada / plaća" },
    { name: "place", label: "Mjesto sklapanja" },
    { name: "terms", label: "Posebni uvjeti", multiline: true, wide: true },
  ],
  request: [
    { name: "requester", label: "Podnositelj zahtjeva", required: true },
    { name: "recipient", label: "Primatelj", required: true },
    { name: "address", label: "Adresa podnositelja" },
    { name: "date", label: "Datum", type: "date", required: true },
    { name: "subject", label: "Predmet zahtjeva / molbe", required: true, wide: true },
    { name: "content", label: "Sadržaj zahtjeva", multiline: true, required: true, wide: true },
    { name: "reason", label: "Obrazloženje", multiline: true, wide: true },
  ],
  termination: [
    { name: "employee", label: "Ime i prezime zaposlenika", required: true },
    { name: "employer", label: "Poslodavac", required: true },
    { name: "employeeAddress", label: "Adresa zaposlenika" },
    { name: "employerAddress", label: "Adresa poslodavca" },
    { name: "date", label: "Datum izjave", type: "date", required: true },
    { name: "lastDay", label: "Predloženi zadnji radni dan", type: "date" },
    { name: "noticePeriod", label: "Otkazni rok" },
    { name: "reason", label: "Razlog / dodatno obrazloženje", multiline: true, wide: true },
  ],
  "purchase-order": [
    { name: "buyer", label: "Naručitelj", required: true },
    { name: "supplier", label: "Dobavljač", required: true },
    { name: "taxId", label: "OIB / porezni broj naručitelja" },
    { name: "orderNumber", label: "Broj narudžbenice", required: true },
    { name: "date", label: "Datum", type: "date", required: true },
    { name: "deliveryDate", label: "Rok isporuke", type: "date" },
    { name: "deliveryAddress", label: "Adresa isporuke", required: true, wide: true },
    { name: "items", label: "Naručene stavke i količine", multiline: true, required: true, wide: true },
    { name: "notes", label: "Napomena", multiline: true, wide: true },
  ],
  minutes: [
    { name: "meetingTitle", label: "Naziv sastanka", required: true, wide: true },
    { name: "date", label: "Datum", type: "date", required: true },
    { name: "time", label: "Vrijeme" },
    { name: "location", label: "Mjesto održavanja", required: true },
    { name: "chairperson", label: "Voditelj sastanka" },
    { name: "participants", label: "Sudionici", multiline: true, required: true, wide: true },
    { name: "agenda", label: "Dnevni red", multiline: true, required: true, wide: true },
    { name: "decisions", label: "Zaključci i odluke", multiline: true, required: true, wide: true },
  ],
  certificate: [
    { name: "issuer", label: "Izdavatelj potvrde", required: true },
    { name: "recipient", label: "Osoba / tvrtka kojoj se izdaje", required: true },
    { name: "issuerTaxId", label: "OIB / porezni broj izdavatelja" },
    { name: "recipientTaxId", label: "OIB / porezni broj primatelja" },
    { name: "purpose", label: "Svrha potvrde", multiline: true, required: true, wide: true },
    { name: "statement", label: "Činjenice koje se potvrđuju", multiline: true, required: true, wide: true },
    { name: "place", label: "Mjesto izdavanja", required: true },
    { name: "date", label: "Datum izdavanja", type: "date", required: true },
  ],
  "business-letter": [
    { name: "sender", label: "Pošiljatelj", required: true },
    { name: "recipient", label: "Primatelj", required: true },
    { name: "senderAddress", label: "Adresa pošiljatelja" },
    { name: "recipientAddress", label: "Adresa primatelja" },
    { name: "date", label: "Datum", type: "date", required: true },
    { name: "subject", label: "Predmet", required: true },
    { name: "salutation", label: "Pozdrav", placeholder: "Poštovani," },
    { name: "signature", label: "Potpis / funkcija" },
    { name: "content", label: "Sadržaj pisma", multiline: true, required: true, wide: true },
  ],
};

type CategoryFormProps = {
  type: Exclude<DocumentType, "invoice" | "proforma" | "offer" | "purchase-order" | "daily-report" | "completed-works-report">;
  locale: DocumentLocale;
  onPreview: (document: GeneratedDocument) => void;
  onLiveChange?: (document: GeneratedDocument) => void;
};

export function CategoryForm({ type, locale, onPreview, onLiveChange }: CategoryFormProps) {
  const fields = fieldsByType[type];
  const initialValues = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, ""])), [fields]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const generated = useMemo<GeneratedDocument>(() => ({ type, title: documentTypeDefinitions[type].label, locale, fields: fields.map((field) => ({ label: field.label, value: values[field.name] ?? "", type: field.type === "date" ? "date" : field.multiline ? "multiline" : undefined })) }), [fields, locale, type, values]);
  useEffect(() => { onLiveChange?.(generated); }, [generated, onLiveChange]);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onPreview(generated);
    }} className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <FormField key={field.name} {...field} value={values[field.name] ?? ""} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} />
        ))}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">Podaci se obrađuju samo lokalno i još se trajno ne spremaju.</p>
        <Button type="submit">Pregledaj dokument</Button>
      </div>
    </form>
  );
}
