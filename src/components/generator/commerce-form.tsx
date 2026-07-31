"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentType } from "@/lib/document-types";

type LineItem = { id: number; description: string; quantity: number; price: number };

const currencyFormatter = new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" });

type CommerceFormProps = { type: Extract<DocumentType, "invoice" | "offer"> };

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-800">{children}</label>;
}

export function CommerceForm({ type }: CommerceFormProps) {
  const label = type === "invoice" ? "fakture" : "ponude";
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: "", quantity: 1, price: 0 }]);
  const [taxRate, setTaxRate] = useState(25);
  const [nextId, setNextId] = useState(2);
  const [isReady, setIsReady] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.price), 0);
    const tax = subtotal * Math.max(0, taxRate) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  function updateItem(id: number, changes: Partial<LineItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
    setIsReady(false);
  }

  function addItem() {
    setItems((current) => [...current, { id: nextId, description: "", quantity: 1, price: 0 }]);
    setNextId((current) => current + 1);
    setIsReady(false);
  }

  function removeItem(id: number) {
    setItems((current) => current.length === 1 ? current : current.filter((item) => item.id !== id));
    setIsReady(false);
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); setIsReady(true); }} className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Podaci izdavatelja</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><FieldLabel htmlFor="company-name">Naziv firme *</FieldLabel><Input id="company-name" required placeholder="Naziv firme" /></div>
          <div><FieldLabel htmlFor="company-tax-id">OIB / porezni broj *</FieldLabel><Input id="company-tax-id" required placeholder="Porezni identifikator" /></div>
          <div className="sm:col-span-2"><FieldLabel htmlFor="company-address">Adresa firme *</FieldLabel><Input id="company-address" required placeholder="Ulica, broj, poštanski broj i grad" /></div>
        </div>
      </section>

      <section className="border-t pt-7">
        <h2 className="text-lg font-semibold text-slate-950">Podaci kupca</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><FieldLabel htmlFor="buyer-name">Naziv / ime kupca *</FieldLabel><Input id="buyer-name" required /></div>
          <div><FieldLabel htmlFor="buyer-tax-id">OIB / porezni broj kupca</FieldLabel><Input id="buyer-tax-id" /></div>
          <div className="sm:col-span-2"><FieldLabel htmlFor="buyer-address">Adresa kupca *</FieldLabel><Input id="buyer-address" required /></div>
        </div>
      </section>

      <section className="border-t pt-7">
        <h2 className="text-lg font-semibold text-slate-950">Podaci dokumenta</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><FieldLabel htmlFor="document-number">Broj {label} *</FieldLabel><Input id="document-number" required placeholder={type === "invoice" ? "npr. 2026-001" : "npr. P-2026-001"} /></div>
          <div><FieldLabel htmlFor="document-date">Datum *</FieldLabel><Input id="document-date" type="date" required /></div>
        </div>
      </section>

      <section className="border-t pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-950">Stavke</h2><p className="mt-1 text-sm text-slate-500">Dodajte proizvoljan broj proizvoda ili usluga.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="size-4" /> Dodaj stavku</Button>
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Stavka {index + 1}</span><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length === 1} aria-label={`Obriši stavku ${index + 1}`}><Trash2 className="size-4 text-slate-500" /></Button></div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_110px_140px_140px] md:items-end">
                <div><FieldLabel htmlFor={`description-${item.id}`}>Opis *</FieldLabel><Input id={`description-${item.id}`} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} required /></div>
                <div><FieldLabel htmlFor={`quantity-${item.id}`}>Količina *</FieldLabel><Input id={`quantity-${item.id}`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} required /></div>
                <div><FieldLabel htmlFor={`price-${item.id}`}>Cijena (€) *</FieldLabel><Input id={`price-${item.id}`} type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItem(item.id, { price: Number(event.target.value) })} required /></div>
                <div><span className="mb-2 block text-sm font-semibold text-slate-800">Iznos</span><div className="flex h-11 items-center rounded-xl border bg-white px-3.5 text-sm font-semibold">{currencyFormatter.format(item.quantity * item.price)}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ml-auto max-w-md rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex items-center justify-between gap-4 border-b border-blue-100 pb-4">
          <FieldLabel htmlFor="tax-rate">PDV %</FieldLabel>
          <Input id="tax-rate" type="number" min="0" step="0.01" value={taxRate} onChange={(event) => { setTaxRate(Number(event.target.value)); setIsReady(false); }} className="w-28 bg-white text-right" />
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-600">Ukupno bez PDV-a</dt><dd className="font-semibold">{currencyFormatter.format(totals.subtotal)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-600">PDV ({taxRate || 0}%)</dt><dd className="font-semibold">{currencyFormatter.format(totals.tax)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-blue-100 pt-3 text-base"><dt className="font-semibold">Ukupno s PDV-om</dt><dd className="font-bold text-blue-700">{currencyFormatter.format(totals.total)}</dd></div>
        </dl>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">Iznosi se automatski izračunavaju. Podaci se još trajno ne spremaju.</p>
        <Button type="submit">Pripremi pregled</Button>
      </div>
      {isReady && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><p><strong>{type === "invoice" ? "Faktura" : "Ponuda"} je izračunata i spremna za pregled.</strong> Finalno generiranje i preuzimanje bit će dodano u sljedećoj fazi.</p></div>}
    </form>
  );
}
