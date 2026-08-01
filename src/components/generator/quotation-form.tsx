"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalSession } from "@/components/session/local-session-provider";
import { useRepositories } from "@/lib/data/use-local-data";
import type { Contact } from "@/lib/data/models";
import type {
  DocumentLocale,
  GeneratedDocument,
} from "@/lib/generated-document";
import {
  listCatalogItems,
  saveCatalogItems,
  type CatalogItem,
} from "@/lib/quotation-catalog";
import {
  calculateQuotationItem,
  calculateQuotationVariant,
  createQuotationData,
  createQuotationGroup,
  createQuotationItem,
  createQuotationVariant,
  quotationUnits,
  type QuotationBlock,
  type QuotationCharge,
  type QuotationData,
  type QuotationGroup,
  type QuotationItem,
  type QuotationSignature,
  type QuotationVariant,
} from "@/lib/quotation";

type Props = {
  locale: DocumentLocale;
  onPreview: (document: GeneratedDocument) => void;
  onLiveChange?: (document: GeneratedDocument) => void;
};
type Deleted = { label: string; restore: () => void };

export function QuotationForm({ locale, onPreview, onLiveChange }: Props) {
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const [data, setData] = useState<QuotationData>(createQuotationData);
  const [contactQuery, setContactQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [deleted, setDeleted] = useState<Deleted | null>(null);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const past = useRef<QuotationData[]>([]);
  const future = useRef<QuotationData[]>([]);
  const company = useMemo(
    () => repositories?.companies.getByUser(user.id) ?? null,
    [repositories, user.id],
  );
  const contacts = useMemo(
    () => repositories?.contacts.list(user.id) ?? [],
    [repositories, user.id],
  );
  const filteredContacts = contacts.filter((contact) =>
    `${contact.companyName} ${contact.contactName} ${contact.email}`
      .toLocaleLowerCase("hr")
      .includes(contactQuery.toLocaleLowerCase("hr")),
  );

  useEffect(() => {
    if (!company || data.company.name) return;
    const timer = window.setTimeout(
      () =>
        setData((current) => ({
          ...current,
          company: {
            ...current.company,
            name: company.companyName,
            address: company.address,
            cityPostalCode: [company.postalCode, company.city]
              .filter(Boolean)
              .join(" "),
            taxNumber: company.taxNumber,
            vatNumber: company.vatNumber,
            phone: company.phone,
            email: company.email,
            website: company.website,
            iban: company.iban,
            swift: company.swift,
            bankName: company.bankName,
          },
          issuePlace: current.issuePlace || company.city,
          responsiblePerson:
            current.responsiblePerson || company.responsiblePerson,
          salesRepresentative:
            current.salesRepresentative || company.responsiblePerson,
          signatures: current.signatures.map((entry, index) =>
            index === 0
              ? { ...entry, name: entry.name || company.responsiblePerson }
              : entry,
          ),
        })),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [company, data.company.name]);

  const generated = useMemo<GeneratedDocument>(() => {
    const selected = data.variants.filter(
      (variant) => variant.selectedForExport && variant.visible,
    );
    const first = selected[0] ?? data.variants[0];
    const totals = first
      ? calculateQuotationVariant(first, data.charges, data.globalDiscountRate)
      : null;
    return {
      type: "offer",
      title: "Ponuda",
      locale: data.language || locale,
      fields: [],
      quotation: data,
      totals:
        totals && data.showPrices
          ? {
              subtotal: totals.subtotalCents / 100,
              taxRate: 0,
              tax: totals.taxCents / 100,
              total: totals.totalCents / 100,
            }
          : undefined,
      images: {
        logo:
          data.headerLayout !== "no-logo" && data.headerLayout !== "minimal"
            ? company?.logoUrl || undefined
            : undefined,
        signature: data.includeSavedSignature
          ? company?.signatureUrl || undefined
          : undefined,
        stamp: data.includeStamp ? company?.stampUrl || undefined : undefined,
      },
    };
  }, [company, data, locale]);
  useEffect(() => {
    onLiveChange?.(generated);
  }, [generated, onLiveChange]);

  const change = useCallback(
    (updater: (current: QuotationData) => QuotationData) => {
      setData((current) => {
        past.current = [...past.current.slice(-49), current];
        future.current = [];
        setHistoryState({ canUndo: true, canRedo: false });
        return updater(current);
      });
    },
    [],
  );
  const set = <K extends keyof QuotationData>(
    key: K,
    value: QuotationData[K],
  ) => change((current) => ({ ...current, [key]: value }));
  function undo() {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(data);
    setData(previous);
    setHistoryState({ canUndo: past.current.length > 0, canRedo: true });
  }
  function redo() {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(data);
    setData(next);
    setHistoryState({ canUndo: true, canRedo: future.current.length > 0 });
  }
  function chooseContact(id: string) {
    setSelectedContact(id);
    const contact = contacts.find((entry) => entry.id === id);
    if (contact) set("customer", contactCustomer(contact));
  }
  function saveCustomerContact() {
    if (!repositories || !data.customer.name) return;
    const existing = selectedContact
      ? repositories.contacts.get(selectedContact)
      : null;
    const now = new Date().toISOString();
    const saved = repositories.contacts.save({
      id: existing?.id ?? "",
      userId: user.id,
      companyName: data.customer.name,
      contactName: data.customer.contactPerson,
      address: data.customer.address,
      city: data.customer.city,
      postalCode: data.customer.postalCode,
      country: data.customer.country,
      taxNumber: data.customer.taxNumber,
      email: data.customer.email,
      phone: data.customer.phone,
      note: existing?.note ?? "",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    setSelectedContact(saved.id);
  }
  function deleteContact() {
    if (
      !repositories ||
      !selectedContact ||
      !window.confirm("Trajno obrisati odabrani kontakt?")
    )
      return;
    repositories.contacts.delete(selectedContact);
    setSelectedContact("");
  }
  function rememberDelete(label: string, restore: () => void) {
    setDeleted({ label, restore });
    window.setTimeout(
      () =>
        setDeleted((current) => (current?.label === label ? null : current)),
      6000,
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onPreview(generated);
      }}
    >
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/95 p-2 shadow-sm backdrop-blur">
        <span className="text-xs text-muted-foreground">Uređivanje ponude</span>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={!historyState.canUndo}
          >
            <Undo2 className="size-4" /> Undo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={!historyState.canRedo}
          >
            <Redo2 className="size-4" /> Redo
          </Button>
        </div>
      </div>
      <Section title="Zaglavlje ponude" open>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Raspored zaglavlja"
            value={data.headerLayout}
            options={[
              ["logo-left", "Logotip lijevo, podaci desno"],
              ["logo-top", "Logotip gore, podaci ispod"],
              ["no-logo", "Bez logotipa"],
              ["minimal", "Minimalističko"],
            ]}
            onChange={(value) =>
              set("headerLayout", value as QuotationData["headerLayout"])
            }
          />
          <SelectField
            label="Vizualni predložak"
            value={data.template}
            options={[
              ["classic", "Klasični"],
              ["modern", "Moderni"],
              ["minimal", "Minimalistički"],
            ]}
            onChange={(value) =>
              set("template", value as QuotationData["template"])
            }
          />
          {Object.entries(data.company)
            .filter(([key]) => key !== "visible")
            .map(([key, value]) => (
              <VisibleText
                key={key}
                label={companyLabels[key] ?? key}
                value={String(value)}
                visible={
                  data.company.visible[key as keyof typeof data.company.visible]
                }
                onChange={(next) =>
                  set("company", { ...data.company, [key]: next })
                }
                onVisible={(visible) =>
                  set("company", {
                    ...data.company,
                    visible: { ...data.company.visible, [key]: visible },
                  })
                }
              />
            ))}
        </div>
      </Section>
      <Section title="Podaci kupca" open>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Pretraži kontakte"
              className="pl-9"
            />
          </div>
          <select
            value={selectedContact}
            onChange={(e) => chooseContact(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Ručni unos / novi kontakt</option>
            {filteredContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.companyName}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={saveCustomerContact}>
            {selectedContact ? "Ažuriraj" : "Dodaj"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={deleteContact}
            disabled={!selectedContact}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(data.customer).map(([key, value]) => (
            <TextField
              key={key}
              label={customerLabels[key] ?? key}
              value={value}
              onChange={(next) =>
                set("customer", { ...data.customer, [key]: next })
              }
            />
          ))}
        </div>
      </Section>
      <Section title="Podaci ponude" open>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Broj ponude"
            value={data.number}
            onChange={(v) => set("number", v)}
          />
          <Button
            type="button"
            variant="outline"
            className="self-end"
            onClick={() =>
              set(
                "number",
                `PON-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
              )
            }
          >
            Automatski generiraj broj
          </Button>
          <TextField
            label="Datum izdavanja"
            type="date"
            value={data.issueDate}
            onChange={(v) => set("issueDate", v)}
          />
          <TextField
            label="Vrijedi do"
            type="date"
            value={data.validUntil}
            onChange={(v) => set("validUntil", v)}
          />
          <TextField
            label="Mjesto izdavanja"
            value={data.issuePlace}
            onChange={(v) => set("issuePlace", v)}
          />
          <TextField
            label="Referentni broj"
            value={data.referenceNumber}
            onChange={(v) => set("referenceNumber", v)}
          />
          <TextField
            label="Predmet ponude"
            value={data.subject}
            onChange={(v) => set("subject", v)}
          />
          <TextField
            label="Projekt"
            value={data.project}
            onChange={(v) => set("project", v)}
          />
          <TextField
            label="Gradilište"
            value={data.site}
            onChange={(v) => set("site", v)}
          />
          <TextField
            label="Odgovorna osoba"
            value={data.responsiblePerson}
            onChange={(v) => set("responsiblePerson", v)}
          />
          <TextField
            label="Prodajni predstavnik"
            value={data.salesRepresentative}
            onChange={(v) => set("salesRepresentative", v)}
          />
          <TextField
            label="Valuta"
            value={data.currency}
            onChange={(v) => set("currency", v)}
          />
          <SelectField
            label="Jezik"
            value={data.language}
            options={[
              ["hr", "Hrvatski"],
              ["en", "English"],
            ]}
            onChange={(v) => set("language", v as "hr" | "en")}
          />
          <SelectField
            label="Status"
            value={data.status}
            options={[
              "nacrt",
              "poslana",
              "prihvaćena",
              "odbijena",
              "istekla",
              "arhivirana",
            ].map((v) => [v, v])}
            onChange={(v) => set("status", v as QuotationData["status"])}
          />
        </div>
      </Section>
      <Section title="Uvodni tekst">
        <BlockEditor
          blocks={data.introBlocks}
          onChange={(blocks) => set("introBlocks", blocks)}
          defaultTitle="Tekstualni blok"
          presets={[
            "Poštovani, zahvaljujemo na upitu. U nastavku dostavljamo ponudu za tražene radove i materijal.",
            "Sukladno vašem upitu dostavljamo komercijalnu i tehničku ponudu.",
          ]}
          rememberDelete={rememberDelete}
        />
      </Section>
      <Section title="Varijante, grupe i stavke" open>
        <VariantEditor
          data={data}
          onChange={(variants) => set("variants", variants)}
          rememberDelete={rememberDelete}
        />
      </Section>
      <Section title="Lokalna baza artikala i usluga">
        <CatalogPanel
          onSelect={(catalog) => {
            const variant = data.variants[0];
            const group = variant?.groups[0];
            if (!variant || !group) return;
            const item = {
              ...createQuotationItem(),
              code: catalog.code,
              name: catalog.name,
              description: catalog.description,
              unit: catalog.unit,
              unitPrice: catalog.unitPrice,
              taxRate: catalog.taxRate,
            };
            set(
              "variants",
              data.variants.map((entry) =>
                entry.id === variant.id
                  ? {
                      ...entry,
                      groups: entry.groups.map((row) =>
                        row.id === group.id
                          ? { ...row, items: [...row.items, item] }
                          : row,
                      ),
                    }
                  : entry,
              ),
            );
          }}
        />
      </Section>
      <Section title="Popusti i dodatni troškovi">
        <NumberField
          label="Popust na cijelu ponudu %"
          value={data.globalDiscountRate}
          onChange={(v) => set("globalDiscountRate", v)}
        />
        <div className="mt-4">
          <ChargeEditor
            charges={data.charges}
            onChange={(charges) => set("charges", charges)}
            rememberDelete={rememberDelete}
          />
        </div>
      </Section>
      <Section title="Financijska rekapitulacija">
        <label className="flex items-center justify-between rounded-xl border p-4">
          <span>
            <strong className="block text-sm">
              Prikaži cijene u dokumentu
            </strong>
            <small className="text-muted-foreground">
              Isključite za tehnički opis opsega bez cijena.
            </small>
          </span>
          <input
            type="checkbox"
            checked={data.showPrices}
            onChange={(e) => set("showPrices", e.target.checked)}
            className="size-5"
          />
        </label>
        {data.showPrices && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.variants.map((variant) => (
              <Summary key={variant.id} data={data} variant={variant} />
            ))}
          </div>
        )}
      </Section>
      <Section title="Uvjeti ponude">
        <BlockEditor
          blocks={data.conditions}
          onChange={(blocks) => set("conditions", blocks)}
          defaultTitle="Novi uvjet"
          presets={[
            "Rok izvođenja",
            "Rok isporuke",
            "Način plaćanja",
            "Rok plaćanja",
            "Važenje ponude",
            "Garancija",
            "Uključeno u cijenu",
            "Nije uključeno u cijenu",
            "Obaveze naručioca",
            "Posebni uslovi",
            "Napomena",
          ]}
          rememberDelete={rememberDelete}
        />
      </Section>
      <Section title="Potpisi i prihvat">
        <SignatureEditor
          signatures={data.signatures}
          onChange={(signatures) => set("signatures", signatures)}
          rememberDelete={rememberDelete}
        />
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.showAcceptanceText}
            onChange={(e) => set("showAcceptanceText", e.target.checked)}
          />{" "}
          Prikaži tekst prihvata
        </label>
        {data.showAcceptanceText && (
          <TextArea
            label="Tekst prihvata"
            value={data.acceptanceText}
            onChange={(v) => set("acceptanceText", v)}
          />
        )}
        <div className="mt-4 flex gap-5 text-sm">
          <label>
            <input
              type="checkbox"
              checked={data.includeSavedSignature}
              onChange={(e) => set("includeSavedSignature", e.target.checked)}
            />{" "}
            Potpis
          </label>
          <label>
            <input
              type="checkbox"
              checked={data.includeStamp}
              onChange={(e) => set("includeStamp", e.target.checked)}
            />{" "}
            Pečat
          </label>
        </div>
      </Section>
      {deleted && (
        <div className="sticky bottom-4 z-30 flex items-center justify-between rounded-xl bg-slate-900 p-3 text-sm text-white shadow-xl">
          <span>{deleted.label} je obrisano.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              deleted.restore();
              setDeleted(null);
            }}
          >
            <ArchiveRestore className="size-4" /> Vrati
          </Button>
        </div>
      )}
      <div className="flex justify-end border-t pt-5">
        <Button type="submit">Pregledaj ponudu</Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group rounded-2xl border bg-background">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
        <span>{title}</span>
        <ChevronDown className="size-4 transition group-open:rotate-180" />
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}
function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <textarea
        className="min-h-24 w-full rounded-md border bg-background p-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function VisibleText({
  label,
  value,
  visible,
  onChange,
  onVisible,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (v: string) => void;
  onVisible: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onVisible(!visible)}
          aria-label={visible ? "Sakrij" : "Prikaži"}
        >
          {visible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function BlockEditor({
  blocks,
  onChange,
  defaultTitle,
  presets,
  rememberDelete,
}: {
  blocks: QuotationBlock[];
  onChange: (v: QuotationBlock[]) => void;
  defaultTitle: string;
  presets: string[];
  rememberDelete: (l: string, r: () => void) => void;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...blocks];
    const t = i + d;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-xl border p-3">
          <div className="mb-2 flex gap-1">
            <Input
              value={block.title}
              onChange={(e) =>
                onChange(
                  blocks.map((v) =>
                    v.id === block.id ? { ...v, title: e.target.value } : v,
                  ),
                )
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange(
                  blocks.map((v) =>
                    v.id === block.id ? { ...v, visible: !v.visible } : v,
                  ),
                )
              }
            >
              {block.visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange([
                  ...blocks.slice(0, index + 1),
                  { ...block, id: crypto.randomUUID() },
                  ...blocks.slice(index + 1),
                ])
              }
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (!confirm("Trajno obrisati blok?")) return;
                onChange(blocks.filter((v) => v.id !== block.id));
                rememberDelete("Blok", () =>
                  onChange([
                    ...blocks.slice(0, index),
                    block,
                    ...blocks.slice(index),
                  ]),
                );
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <textarea
            className="min-h-20 w-full rounded-md border p-2 text-sm"
            value={block.content}
            onChange={(e) =>
              onChange(
                blocks.map((v) =>
                  v.id === block.id ? { ...v, content: e.target.value } : v,
                ),
              )
            }
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onChange([
              ...blocks,
              {
                id: crypto.randomUUID(),
                title: defaultTitle,
                content: "",
                visible: true,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Dodaj blok
        </Button>
        <select
          className="h-9 rounded-md border bg-background px-2 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value)
              onChange([
                ...blocks,
                {
                  id: crypto.randomUUID(),
                  title: defaultTitle,
                  content: e.target.value,
                  visible: true,
                },
              ]);
            e.target.value = "";
          }}
        >
          <option value="">Odaberi predložak</option>
          {presets.map((p) => (
            <option key={p} value={p}>
              {p.slice(0, 55)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function VariantEditor({
  data,
  onChange,
  rememberDelete,
}: {
  data: QuotationData;
  onChange: (v: QuotationVariant[]) => void;
  rememberDelete: (l: string, r: () => void) => void;
}) {
  const variants = data.variants;
  const update = (id: string, patch: Partial<QuotationVariant>) =>
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  return (
    <div className="space-y-4">
      {variants.map((variant, index) => (
        <div key={variant.id} className="rounded-xl border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="max-w-xs"
              value={variant.name}
              onChange={(e) => update(variant.id, { name: e.target.value })}
            />
            <label className="text-xs">
              <input
                type="checkbox"
                checked={variant.recommended}
                onChange={(e) =>
                  update(variant.id, { recommended: e.target.checked })
                }
              />{" "}
              Preporučena
            </label>
            <label className="text-xs">
              <input
                type="checkbox"
                checked={variant.selectedForExport}
                onChange={(e) =>
                  update(variant.id, { selectedForExport: e.target.checked })
                }
              />{" "}
              PDF/DOCX
            </label>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => update(variant.id, { visible: !variant.visible })}
              aria-label={
                variant.visible ? "Sakrij varijantu" : "Prikaži varijantu"
              }
            >
              {variant.visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={index === 0}
              onClick={() => {
                const next = [...variants];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
              aria-label="Pomakni varijantu gore"
            >
              ↑
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={index === variants.length - 1}
              onClick={() => {
                const next = [...variants];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                onChange(next);
              }}
              aria-label="Pomakni varijantu dolje"
            >
              ↓
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange([
                  ...variants.slice(0, index + 1),
                  {
                    ...structuredClone(variant),
                    id: crypto.randomUUID(),
                    name: `${variant.name} kopija`,
                  },
                  ...variants.slice(index + 1),
                ])
              }
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (!confirm("Trajno obrisati varijantu?")) return;
                onChange(variants.filter((v) => v.id !== variant.id));
                rememberDelete("Varijanta", () =>
                  onChange([
                    ...variants.slice(0, index),
                    variant,
                    ...variants.slice(index),
                  ]),
                );
              }}
              disabled={variants.length === 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {variant.groups.map((group, groupIndex) => (
              <GroupEditor
                key={group.id}
                group={group}
                variant={variant}
                onVariant={(next) => update(variant.id, next)}
                rememberDelete={rememberDelete}
                index={groupIndex}
              />
            ))}
          </div>
          <Button
            type="button"
            className="mt-3"
            variant="outline"
            onClick={() =>
              update(variant.id, {
                groups: [...variant.groups, createQuotationGroup()],
              })
            }
          >
            <Plus className="size-4" />
            Dodaj grupu
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...variants,
            createQuotationVariant(
              `Opcija ${String.fromCharCode(65 + variants.length)}`,
            ),
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj varijantu
      </Button>
    </div>
  );
}
function GroupEditor({
  group,
  variant,
  onVariant,
  rememberDelete,
  index,
}: {
  group: QuotationGroup;
  variant: QuotationVariant;
  onVariant: (v: Partial<QuotationVariant>) => void;
  rememberDelete: (l: string, r: () => void) => void;
  index: number;
}) {
  const groups = variant.groups;
  const update = (patch: Partial<QuotationGroup>) =>
    onVariant({
      groups: groups.map((g) => (g.id === group.id ? { ...g, ...patch } : g)),
    });
  const move = (d: -1 | 1) => {
    const n = [...groups],
      t = index + d;
    if (t < 0 || t >= n.length) return;
    [n[index], n[t]] = [n[t], n[index]];
    onVariant({ groups: n });
  };
  const moveItem = (item: QuotationItem, target: string) =>
    onVariant({
      groups: groups.map((g) =>
        g.id === group.id
          ? { ...g, items: g.items.filter((v) => v.id !== item.id) }
          : g.id === target
            ? { ...g, items: [...g.items, item] }
            : g,
      ),
    });
  return (
    <details open={!group.collapsed} className="rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-2">
        <GripVertical className="size-4" />
        <Input
          value={group.name}
          onClick={(e) => e.preventDefault()}
          onChange={(e) => update({ name: e.target.value })}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            update({ visible: !group.visible });
          }}
        >
          {group.visible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            move(-1);
          }}
        >
          ↑
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            move(1);
          }}
        >
          ↓
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            onVariant({
              groups: [
                ...groups.slice(0, index + 1),
                {
                  ...structuredClone(group),
                  id: crypto.randomUUID(),
                  name: `${group.name} kopija`,
                },
                ...groups.slice(index + 1),
              ],
            });
          }}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={groups.length === 1}
          onClick={(e) => {
            e.preventDefault();
            if (!confirm("Trajno obrisati grupu?")) return;
            onVariant({ groups: groups.filter((g) => g.id !== group.id) });
            rememberDelete("Grupa", () =>
              onVariant({
                groups: [
                  ...groups.slice(0, index),
                  group,
                  ...groups.slice(index),
                ],
              }),
            );
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </summary>
      <div className="border-t p-3">
        <NumberField
          label="Popust grupe %"
          value={group.discountRate}
          onChange={(v) => update({ discountRate: v })}
        />
        <div className="mt-3 space-y-3">
          {group.items.map((item, itemIndex) => (
            <QuotationItemEditor
              key={item.id}
              item={item}
              group={group}
              variant={variant}
              index={itemIndex}
              onItems={(items) => update({ items })}
              onMoveGroup={(target) => moveItem(item, target)}
              rememberDelete={rememberDelete}
            />
          ))}
        </div>
        <Button
          type="button"
          className="mt-3"
          variant="outline"
          onClick={() =>
            update({ items: [...group.items, createQuotationItem()] })
          }
        >
          <Plus className="size-4" />
          Dodaj stavku
        </Button>
      </div>
    </details>
  );
}
function QuotationItemEditor({
  item,
  group,
  variant,
  index,
  onItems,
  onMoveGroup,
  rememberDelete,
}: {
  item: QuotationItem;
  group: QuotationGroup;
  variant: QuotationVariant;
  index: number;
  onItems: (v: QuotationItem[]) => void;
  onMoveGroup: (id: string) => void;
  rememberDelete: (l: string, r: () => void) => void;
}) {
  const items = group.items;
  const update = (patch: Partial<QuotationItem>) =>
    onItems(items.map((v) => (v.id === item.id ? { ...v, ...patch } : v)));
  const amount = calculateQuotationItem(item, group.discountRate, 0);
  const move = (d: -1 | 1) => {
    const n = [...items],
      t = index + d;
    if (t < 0 || t >= n.length) return;
    [n[index], n[t]] = [n[t], n[index]];
    onItems(n);
  };
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="mb-2 flex justify-end gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => update({ visible: !item.visible })}
        >
          {item.visible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => move(-1)}
        >
          ↑
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => move(1)}
        >
          ↓
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() =>
            onItems([
              ...items.slice(0, index + 1),
              { ...item, id: crypto.randomUUID() },
              ...items.slice(index + 1),
            ])
          }
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            if (!confirm("Trajno obrisati stavku?")) return;
            onItems(items.filter((v) => v.id !== item.id));
            rememberDelete("Stavka", () =>
              onItems([...items.slice(0, index), item, ...items.slice(index)]),
            );
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Šifra"
          value={item.code}
          onChange={(v) => update({ code: v })}
        />
        <TextField
          label="Naziv"
          value={item.name}
          onChange={(v) => update({ name: v })}
        />
        <TextField
          label="Detaljan opis"
          value={item.description}
          onChange={(v) => update({ description: v })}
        />
        <TextField
          label="Napomena"
          value={item.note}
          onChange={(v) => update({ note: v })}
        />
        <NumberField
          label="Količina"
          value={item.quantity}
          onChange={(v) => update({ quantity: v })}
        />
        <label>
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            Jedinica
          </span>
          <Input
            list={`quotation-units-${item.id}`}
            value={item.unit}
            onChange={(e) => update({ unit: e.target.value })}
          />
          <datalist id={`quotation-units-${item.id}`}>
            {quotationUnits.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>
        <NumberField
          label="Cijena"
          value={item.unitPrice}
          onChange={(v) => update({ unitPrice: v })}
        />
        <NumberField
          label="Popust %"
          value={item.discountRate}
          onChange={(v) => update({ discountRate: v })}
        />
        <NumberField
          label="PDV %"
          value={item.taxRate}
          onChange={(v) => update({ taxRate: v })}
        />
        <label className="self-end text-xs">
          <input
            type="checkbox"
            checked={item.includedInCalculation}
            onChange={(e) =>
              update({ includedInCalculation: e.target.checked })
            }
          />{" "}
          Uključi u izračun
        </label>
        <SelectField
          label="Premjesti u grupu"
          value={group.id}
          options={variant.groups.map((g) => [g.id, g.name])}
          onChange={onMoveGroup}
        />
        <div className="self-end text-sm font-semibold">
          Ukupno: {(amount.totalCents / 100).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ChargeEditor({
  charges,
  onChange,
  rememberDelete,
}: {
  charges: QuotationCharge[];
  onChange: (v: QuotationCharge[]) => void;
  rememberDelete: (l: string, r: () => void) => void;
}) {
  return (
    <div className="space-y-2">
      {charges.map((charge, index) => (
        <div
          key={charge.id}
          className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_120px_100px_auto_auto]"
        >
          <Input
            value={charge.name}
            onChange={(e) =>
              onChange(
                charges.map((v) =>
                  v.id === charge.id ? { ...v, name: e.target.value } : v,
                ),
              )
            }
          />
          <Input
            type="number"
            value={charge.amount}
            onChange={(e) =>
              onChange(
                charges.map((v) =>
                  v.id === charge.id
                    ? { ...v, amount: Number(e.target.value) || 0 }
                    : v,
                ),
              )
            }
          />
          <Input
            type="number"
            value={charge.taxRate}
            onChange={(e) =>
              onChange(
                charges.map((v) =>
                  v.id === charge.id
                    ? { ...v, taxRate: Number(e.target.value) || 0 }
                    : v,
                ),
              )
            }
          />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={charge.includedInCalculation}
              onChange={(e) =>
                onChange(
                  charges.map((v) =>
                    v.id === charge.id
                      ? { ...v, includedInCalculation: e.target.checked }
                      : v,
                  ),
                )
              }
            />{" "}
            U obračunu
          </label>
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={index === 0}
              onClick={() => {
                const next = [...charges];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={index === charges.length - 1}
              onClick={() => {
                const next = [...charges];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                onChange(next);
              }}
            >
              ↓
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange(
                  charges.map((v) =>
                    v.id === charge.id ? { ...v, visible: !v.visible } : v,
                  ),
                )
              }
            >
              {charge.visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange([
                  ...charges.slice(0, index + 1),
                  { ...charge, id: crypto.randomUUID() },
                  ...charges.slice(index + 1),
                ])
              }
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (!confirm("Trajno obrisati trošak?")) return;
                onChange(charges.filter((v) => v.id !== charge.id));
                rememberDelete("Trošak", () =>
                  onChange([
                    ...charges.slice(0, index),
                    charge,
                    ...charges.slice(index),
                  ]),
                );
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...charges,
            {
              id: crypto.randomUUID(),
              name: "Transport",
              amount: 0,
              taxRate: 25,
              includedInCalculation: true,
              visible: true,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj trošak
      </Button>
    </div>
  );
}
function SignatureEditor({
  signatures,
  onChange,
  rememberDelete,
}: {
  signatures: QuotationSignature[];
  onChange: (v: QuotationSignature[]) => void;
  rememberDelete: (l: string, r: () => void) => void;
}) {
  return (
    <div className="space-y-2">
      {signatures.map((s, index) => (
        <div
          key={s.id}
          className="grid gap-2 rounded-lg border p-2 sm:grid-cols-2"
        >
          <Input
            value={s.title}
            onChange={(e) =>
              onChange(
                signatures.map((v) =>
                  v.id === s.id ? { ...v, title: e.target.value } : v,
                ),
              )
            }
          />
          <Input
            value={s.name}
            placeholder="Ime i prezime"
            onChange={(e) =>
              onChange(
                signatures.map((v) =>
                  v.id === s.id ? { ...v, name: e.target.value } : v,
                ),
              )
            }
          />
          <Input
            value={s.role}
            placeholder="Funkcija"
            onChange={(e) =>
              onChange(
                signatures.map((v) =>
                  v.id === s.id ? { ...v, role: e.target.value } : v,
                ),
              )
            }
          />
          <Input
            type="date"
            value={s.date}
            onChange={(e) =>
              onChange(
                signatures.map((v) =>
                  v.id === s.id ? { ...v, date: e.target.value } : v,
                ),
              )
            }
          />
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange(
                  signatures.map((v) =>
                    v.id === s.id ? { ...v, visible: !v.visible } : v,
                  ),
                )
              }
            >
              {s.visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange([
                  ...signatures.slice(0, index + 1),
                  { ...s, id: crypto.randomUUID() },
                  ...signatures.slice(index + 1),
                ])
              }
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (!confirm("Obrisati potpisno polje?")) return;
                onChange(signatures.filter((v) => v.id !== s.id));
                rememberDelete("Potpis", () =>
                  onChange([
                    ...signatures.slice(0, index),
                    s,
                    ...signatures.slice(index),
                  ]),
                );
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...signatures,
            {
              id: crypto.randomUUID(),
              title: "Novo potpisno polje",
              name: "",
              role: "",
              date: "",
              visible: true,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj potpis
      </Button>
    </div>
  );
}
function Summary({
  data,
  variant,
}: {
  data: QuotationData;
  variant: QuotationVariant;
}) {
  const s = calculateQuotationVariant(
    variant,
    data.charges,
    data.globalDiscountRate,
  );
  return (
    <div className="rounded-xl bg-muted p-3 text-sm">
      <strong>{variant.name}</strong>
      <p>Bruto: {(s.grossCents / 100).toFixed(2)}</p>
      <p>Popusti: {(s.discountCents / 100).toFixed(2)}</p>
      <p>Troškovi: {(s.chargesCents / 100).toFixed(2)}</p>
      <p>Osnovica: {(s.subtotalCents / 100).toFixed(2)}</p>
      {Object.entries(s.taxByRate).map(([r, v]) => (
        <p key={r}>
          PDV {r}%: {(v / 100).toFixed(2)}
        </p>
      ))}
      <p className="font-bold">
        Ukupno: {(s.totalCents / 100).toFixed(2)} {data.currency}
      </p>
    </div>
  );
}

function CatalogPanel({ onSelect }: { onSelect: (item: CatalogItem) => void }) {
  const [items, setItems] = useState<CatalogItem[]>(listCatalogItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [catalogSort, setCatalogSort] = useState<"name" | "code" | "price">(
    "name",
  );
  const save = (next: CatalogItem[]) => {
    setItems(next);
    saveCatalogItems(next);
  };
  const updateCatalog = (id: string, patch: Partial<CatalogItem>) =>
    save(
      items.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  const visible = items
    .filter(
      (i) =>
        (filter === "all" || i.category === filter) &&
        `${i.code} ${i.name}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      catalogSort === "price"
        ? a.unitPrice - b.unitPrice
        : a[catalogSort].localeCompare(b[catalogSort]),
    );
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži katalog"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-md border bg-background px-2"
        >
          <option value="all">Sve kategorije</option>
          {[...new Set(items.map((i) => i.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={catalogSort}
          onChange={(e) =>
            setCatalogSort(e.target.value as "name" | "code" | "price")
          }
          className="h-10 rounded-md border bg-background px-2"
        >
          <option value="name">Sort: naziv</option>
          <option value="code">Sort: šifra</option>
          <option value="price">Sort: cijena</option>
        </select>
      </div>
      <div className="mt-3 space-y-2">
        {visible.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg border p-2 sm:grid-cols-2"
          >
            <Input
              value={item.code}
              onChange={(e) =>
                save(
                  items.map((v) =>
                    v.id === item.id ? { ...v, code: e.target.value } : v,
                  ),
                )
              }
            />
            <Input
              value={item.name}
              onChange={(e) =>
                save(
                  items.map((v) =>
                    v.id === item.id ? { ...v, name: e.target.value } : v,
                  ),
                )
              }
            />
            <Input
              value={item.description}
              placeholder="Opis"
              onChange={(e) =>
                updateCatalog(item.id, { description: e.target.value })
              }
            />
            <Input
              list={`catalog-units-${item.id}`}
              value={item.unit}
              placeholder="Jedinica"
              onChange={(e) => updateCatalog(item.id, { unit: e.target.value })}
            />
            <datalist id={`catalog-units-${item.id}`}>
              {quotationUnits.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
            <Input
              type="number"
              value={item.unitPrice}
              onChange={(e) =>
                save(
                  items.map((v) =>
                    v.id === item.id
                      ? { ...v, unitPrice: Number(e.target.value) || 0 }
                      : v,
                  ),
                )
              }
            />
            <Input
              type="number"
              value={item.taxRate}
              placeholder="PDV %"
              onChange={(e) =>
                updateCatalog(item.id, { taxRate: Number(e.target.value) || 0 })
              }
            />
            <Input
              value={item.category}
              placeholder="Kategorija"
              onChange={(e) =>
                updateCatalog(item.id, { category: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) =>
                  updateCatalog(item.id, { active: e.target.checked })
                }
              />{" "}
              Aktivan
            </label>
            <div className="flex">
              <Button type="button" size="sm" onClick={() => onSelect(item)}>
                Odaberi
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  save([
                    ...items.slice(0, index + 1),
                    {
                      ...item,
                      id: crypto.randomUUID(),
                      code: `${item.code}-COPY`,
                    },
                    ...items.slice(index + 1),
                  ])
                }
              >
                <Copy className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm("Obrisati artikl?"))
                    save(items.filter((v) => v.id !== item.id));
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        className="mt-3"
        variant="outline"
        onClick={() =>
          save([
            ...items,
            {
              id: crypto.randomUUID(),
              code: "",
              name: "Novi artikl",
              description: "",
              unit: "kom",
              unitPrice: 0,
              taxRate: 25,
              category: "Ostalo",
              active: true,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj artikl
      </Button>
    </div>
  );
}
function contactCustomer(contact: Contact): QuotationData["customer"] {
  return {
    name: contact.companyName,
    address: contact.address,
    city: contact.city,
    postalCode: contact.postalCode,
    country: contact.country,
    taxNumber: contact.taxNumber,
    contactPerson: contact.contactName,
    phone: contact.phone,
    email: contact.email,
  };
}
const companyLabels: Record<string, string> = {
  name: "Naziv firme",
  address: "Adresa",
  cityPostalCode: "Grad i poštanski broj",
  taxNumber: "OIB / PIB",
  vatNumber: "PDV broj",
  phone: "Telefon",
  email: "Email",
  website: "Web stranica",
  iban: "IBAN",
  swift: "SWIFT",
  bankName: "Naziv banke",
};
const customerLabels: Record<string, string> = {
  name: "Naziv firme ili ime",
  address: "Adresa",
  city: "Grad",
  postalCode: "Poštanski broj",
  country: "Država",
  taxNumber: "OIB / PIB",
  contactPerson: "Kontakt osoba",
  phone: "Telefon",
  email: "Email",
};
