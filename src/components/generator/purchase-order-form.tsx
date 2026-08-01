"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalSession } from "@/components/session/local-session-provider";
import { useRepositories } from "@/lib/data/use-local-data";
import type { Contact } from "@/lib/data/models";
import type { DocumentLocale, GeneratedDocument } from "@/lib/generated-document";
import {
  calculatePurchaseOrderItem,
  calculatePurchaseOrderTotals,
  emptyPurchaseOrderItem,
  localIsoDate,
  purchaseOrderUnits,
  type PurchaseOrderData,
  type PurchaseOrderItem,
  type PurchaseOrderParty,
  type PurchaseOrderSignature,
} from "@/lib/purchase-order";

type Props = { locale: DocumentLocale; initial?: PurchaseOrderData; onPreview: (document: GeneratedDocument) => void; onLiveChange?: (document: GeneratedDocument) => void };

const blankParty = (): PurchaseOrderParty => ({ name: "", address: "", cityPostalCode: "", taxNumber: "", contactPerson: "", phone: "", email: "" });
const blankSignature = (): PurchaseOrderSignature => ({ name: "", role: "", date: "" });

function initialData(): PurchaseOrderData {
  const today = localIsoDate();
  return {
    buyer: blankParty(), supplier: blankParty(), orderNumber: `N-${today.replaceAll("-", "")}-001`, issueDate: today,
    issuePlace: "", desiredDeliveryDate: "", deliveryPlace: "", deliveryMethod: "", paymentDeadline: "", paymentMethod: "",
    currency: "EUR", offerReference: "", project: "", responsiblePerson: "", note: "", deliveryTerms: "", paymentTerms: "",
    showPrices: true, items: [emptyPurchaseOrderItem()], orderedBy: blankSignature(), approvedBy: blankSignature(),
    supplierConfirmation: blankSignature(), includeSavedSignature: true, includeStamp: true,
  };
}

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="group rounded-2xl border bg-background"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold"><span>{title}</span><ChevronDown className="size-4 transition group-open:rotate-180" /></summary><div className="border-t p-4">{children}</div></details>;
}

function TextField({ label, value, onChange, type = "text", wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function PartyFields({ value, onChange }: { value: PurchaseOrderParty; onChange: (party: PurchaseOrderParty) => void }) {
  const set = (key: keyof PurchaseOrderParty, next: string) => onChange({ ...value, [key]: next });
  return <div className="grid gap-4 sm:grid-cols-2"><TextField label="Naziv firme ili ime" value={value.name} onChange={(v) => set("name", v)} wide /><TextField label="Adresa" value={value.address} onChange={(v) => set("address", v)} wide /><TextField label="Grad i poštanski broj" value={value.cityPostalCode} onChange={(v) => set("cityPostalCode", v)} /><TextField label="OIB / PIB" value={value.taxNumber} onChange={(v) => set("taxNumber", v)} /><TextField label="Kontakt osoba" value={value.contactPerson} onChange={(v) => set("contactPerson", v)} /><TextField label="Telefon" value={value.phone} onChange={(v) => set("phone", v)} /><TextField label="Email" type="email" value={value.email} onChange={(v) => set("email", v)} /></div>;
}

function SignatureFields({ title, value, onChange }: { title: string; value: PurchaseOrderSignature; onChange: (signature: PurchaseOrderSignature) => void }) {
  const set = (key: keyof PurchaseOrderSignature, next: string) => onChange({ ...value, [key]: next });
  return <div className="rounded-xl border p-3"><p className="mb-3 text-sm font-semibold">{title}</p><div className="grid gap-3 sm:grid-cols-3"><TextField label="Ime i prezime" value={value.name} onChange={(v) => set("name", v)} /><TextField label="Funkcija" value={value.role} onChange={(v) => set("role", v)} /><TextField label="Datum" type="date" value={value.date} onChange={(v) => set("date", v)} /></div></div>;
}

export function PurchaseOrderForm({ locale, initial, onPreview, onLiveChange }: Props) {
  const repositories = useRepositories(); const { user } = useLocalSession();
  const [data, setData] = useState<PurchaseOrderData>(() => initial ?? initialData());
  const company = useMemo(() => repositories?.companies.getByUser(user.id) ?? null, [repositories, user.id]);
  const contacts = useMemo(() => repositories?.contacts.list(user.id) ?? [], [repositories, user.id]);

  useEffect(() => {
    if (!company || data.buyer.name) return;
    const timer = window.setTimeout(() => setData((current) => ({ ...current, buyer: { name: company.companyName, address: company.address, cityPostalCode: [company.postalCode, company.city].filter(Boolean).join(" "), taxNumber: company.taxNumber || company.vatNumber, contactPerson: company.responsiblePerson, phone: company.phone, email: company.email }, issuePlace: current.issuePlace || company.city, responsiblePerson: current.responsiblePerson || company.responsiblePerson, orderedBy: { ...current.orderedBy, name: current.orderedBy.name || company.responsiblePerson } })), 0);
    return () => window.clearTimeout(timer);
  }, [company, data.buyer.name]);

  const totals = useMemo(() => calculatePurchaseOrderTotals(data.items), [data.items]);
  const generated = useMemo<GeneratedDocument>(() => ({
    type: "purchase-order", title: "Narudžbenica", locale, fields: [], purchaseOrder: data,
    items: data.items.map((item) => ({ description: item.name, quantity: item.quantity, price: item.unitPrice, amount: calculatePurchaseOrderItem(item).net })),
    totals: data.showPrices ? { subtotal: totals.subtotal, taxRate: 0, tax: totals.tax, total: totals.total } : undefined,
    images: { logo: company?.logoUrl || undefined, signature: data.includeSavedSignature ? company?.signatureUrl || undefined : undefined, stamp: data.includeStamp ? company?.stampUrl || undefined : undefined },
  }), [company, data, locale, totals]);
  useEffect(() => { onLiveChange?.(generated); }, [generated, onLiveChange]);

  const setParty = (key: "buyer" | "supplier", party: PurchaseOrderParty) => setData((current) => ({ ...current, [key]: party }));
  const setValue = <K extends keyof PurchaseOrderData>(key: K, value: PurchaseOrderData[K]) => setData((current) => ({ ...current, [key]: value }));
  const updateItem = (id: string, patch: Partial<PurchaseOrderItem>) => setData((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const moveItem = (index: number, direction: -1 | 1) => setData((current) => { const next = [...current.items]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return { ...current, items: next }; });
  function chooseSupplier(contactId: string) { const contact = contacts.find((item) => item.id === contactId); if (contact) setParty("supplier", contactToParty(contact)); }

  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onPreview(generated); }}>
    <Section title="Naručitelj" open><PartyFields value={data.buyer} onChange={(party) => setParty("buyer", party)} /></Section>
    <Section title="Dobavljač" open><label className="mb-4 block"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Odaberi spremljeni kontakt</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="" onChange={(event) => chooseSupplier(event.target.value)}><option value="">Ručni unos</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.companyName}</option>)}</select></label><PartyFields value={data.supplier} onChange={(party) => setParty("supplier", party)} /></Section>
    <Section title="Podaci narudžbenice" open><div className="grid gap-4 sm:grid-cols-2"><TextField label="Broj narudžbenice" value={data.orderNumber} onChange={(v) => setValue("orderNumber", v)} /><TextField label="Datum izdavanja" type="date" value={data.issueDate} onChange={(v) => setValue("issueDate", v)} /><TextField label="Mjesto izdavanja" value={data.issuePlace} onChange={(v) => setValue("issuePlace", v)} /><TextField label="Željeni datum isporuke" type="date" value={data.desiredDeliveryDate} onChange={(v) => setValue("desiredDeliveryDate", v)} /><TextField label="Referenca na ponudu (opcionalno)" value={data.offerReference} onChange={(v) => setValue("offerReference", v)} /><TextField label="Projekt ili gradilište (opcionalno)" value={data.project} onChange={(v) => setValue("project", v)} /><TextField label="Odgovorna osoba" value={data.responsiblePerson} onChange={(v) => setValue("responsiblePerson", v)} /></div></Section>
    <Section title="Stavke" open><div className="space-y-3">{data.items.map((item, index) => <ItemEditor key={item.id} item={item} index={index} count={data.items.length} showPrices={data.showPrices} onChange={(patch) => updateItem(item.id, patch)} onDuplicate={() => setData((current) => ({ ...current, items: [...current.items.slice(0, index + 1), { ...item, id: crypto.randomUUID() }, ...current.items.slice(index + 1)] }))} onMove={(direction) => moveItem(index, direction)} onDelete={() => setData((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }))} />)}<Button type="button" variant="outline" onClick={() => setData((current) => ({ ...current, items: [...current.items, emptyPurchaseOrderItem()] }))}><Plus className="size-4" /> Dodaj stavku</Button></div></Section>
    <Section title="Financije"><label className="flex items-center justify-between gap-4 rounded-xl border p-4"><span><strong className="block text-sm">Prikaži cijene u narudžbenici</strong><small className="text-muted-foreground">Isključite za narudžbu samo količina i jedinica.</small></span><input type="checkbox" checked={data.showPrices} onChange={(event) => setValue("showPrices", event.target.checked)} className="size-5 accent-primary" /></label>{data.showPrices && <div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField label="Valuta" value={data.currency} onChange={(v) => setValue("currency", v)} /><div className="rounded-xl bg-muted p-3 text-sm"><p>Bez PDV-a: {money(totals.subtotal, data.currency)}</p><p>Popust: {money(totals.discount, data.currency)}</p><p>PDV: {money(totals.tax, data.currency)}</p><p className="mt-1 font-bold">Ukupno: {money(totals.total, data.currency)}</p></div></div>}</Section>
    <Section title="Isporuka i plaćanje"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Mjesto isporuke" value={data.deliveryPlace} onChange={(v) => setValue("deliveryPlace", v)} wide /><TextField label="Način isporuke" value={data.deliveryMethod} onChange={(v) => setValue("deliveryMethod", v)} /><TextField label="Rok plaćanja" value={data.paymentDeadline} onChange={(v) => setValue("paymentDeadline", v)} /><TextField label="Način plaćanja" value={data.paymentMethod} onChange={(v) => setValue("paymentMethod", v)} /></div></Section>
    <Section title="Napomena i uvjeti"><div className="grid gap-4"><TextArea label="Napomena" value={data.note} onChange={(v) => setValue("note", v)} /><TextArea label="Uvjeti isporuke" value={data.deliveryTerms} onChange={(v) => setValue("deliveryTerms", v)} /><TextArea label="Uvjeti plaćanja" value={data.paymentTerms} onChange={(v) => setValue("paymentTerms", v)} /></div></Section>
    <Section title="Potpisi"><div className="space-y-4"><SignatureFields title="Naručio" value={data.orderedBy} onChange={(v) => setValue("orderedBy", v)} /><SignatureFields title="Odobrio" value={data.approvedBy} onChange={(v) => setValue("approvedBy", v)} /><SignatureFields title="Dobavljač / potvrda primitka" value={data.supplierConfirmation} onChange={(v) => setValue("supplierConfirmation", v)} /><div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={data.includeSavedSignature} onChange={(e) => setValue("includeSavedSignature", e.target.checked)} /> Uključi spremljeni potpis</label><label className="flex items-center gap-2"><input type="checkbox" checked={data.includeStamp} onChange={(e) => setValue("includeStamp", e.target.checked)} /> Uključi pečat</label></div></div></Section>
    <div className="flex justify-end border-t pt-5"><Button type="submit">Pregledaj narudžbenicu</Button></div>
  </form>;
}

function ItemEditor({ item, index, count, showPrices, onChange, onDuplicate, onMove, onDelete }: { item: PurchaseOrderItem; index: number; count: number; showPrices: boolean; onChange: (patch: Partial<PurchaseOrderItem>) => void; onDuplicate: () => void; onMove: (direction: -1 | 1) => void; onDelete: () => void }) {
  return <div className="rounded-xl border p-3"><div className="mb-3 flex items-center gap-2"><GripVertical className="size-4 text-muted-foreground" /><strong className="text-sm">Stavka {index + 1}</strong><div className="ml-auto flex"><Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Pomakni gore">↑</Button><Button type="button" size="icon" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Pomakni dolje">↓</Button><Button type="button" size="icon" variant="ghost" onClick={onDuplicate} aria-label="Dupliciraj"><Copy className="size-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={count === 1} onClick={onDelete} aria-label="Obriši"><Trash2 className="size-4 text-red-500" /></Button></div></div><div className="grid gap-3 sm:grid-cols-2"><TextField label="Naziv ili opis" value={item.name} onChange={(v) => onChange({ name: v })} wide /><TextField label="Dodatni opis (opcionalno)" value={item.description} onChange={(v) => onChange({ description: v })} wide /><NumberField label="Količina" value={item.quantity} min={0} step="any" onChange={(v) => onChange({ quantity: v })} /><label><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Jedinica mjere</span><Input list={`units-${item.id}`} value={item.unit} onChange={(e) => onChange({ unit: e.target.value })} /><datalist id={`units-${item.id}`}>{purchaseOrderUnits.map((unit) => <option key={unit} value={unit} />)}</datalist></label>{showPrices && <><NumberField label="Cijena po jedinici" value={item.unitPrice} min={0} step="0.01" onChange={(v) => onChange({ unitPrice: v })} /><NumberField label="Popust %" value={item.discountRate} min={0} max={100} step="0.01" onChange={(v) => onChange({ discountRate: v })} /><NumberField label="PDV %" value={item.taxRate} min={0} max={100} step="0.01" onChange={(v) => onChange({ taxRate: v })} /><div className="self-end rounded-md bg-muted px-3 py-2 text-sm"><span className="text-muted-foreground">Ukupno: </span><strong>{calculatePurchaseOrderItem(item).total.toFixed(2)}</strong></div></>}</div></div>;
}

function NumberField({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: string }) { return <label><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><Input type="number" inputMode="decimal" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value) || 0)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function contactToParty(contact: Contact): PurchaseOrderParty { return { name: contact.companyName, address: contact.address, cityPostalCode: [contact.postalCode, contact.city].filter(Boolean).join(" "), taxNumber: contact.taxNumber, contactPerson: contact.contactName, phone: contact.phone, email: contact.email }; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat("hr-HR", { style: "currency", currency }).format(value); } catch { return `${value.toFixed(2)} ${currency}`; } }
