"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { saveEditorDraft } from "@/lib/data/draft-service";
import type {
  GeneratedDocument,
  DocumentLocale,
} from "@/lib/generated-document";
import {
  listCatalogItems,
  saveCatalogItems,
  type CatalogItem,
} from "@/lib/quotation-catalog";
import {
  calculateInvoice,
  createInvoiceData,
  createInvoiceGroup,
  createInvoiceItem,
  invoiceTaxRates,
  invoiceUnits,
  suggestedLegalNote,
  type InvoiceBlock,
  type InvoiceCharge,
  type InvoiceData,
  type InvoiceGroup,
  type InvoiceItem,
  type InvoicePayment,
  type InvoiceSignature,
} from "@/lib/invoice";

type Props = {
  locale: DocumentLocale;
  onPreview: (document: GeneratedDocument) => void;
  onLiveChange?: (document: GeneratedDocument) => void;
};
const field =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const textarea = `${field} min-h-20 py-2`;
const move = <T,>(values: T[], index: number, direction: -1 | 1) => {
  const next = [...values];
  const target = index + direction;
  if (target < 0 || target >= next.length) return values;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
const clone = <T extends { id: string }>(value: T): T => ({
  ...structuredClone(value),
  id: crypto.randomUUID(),
});

export function InvoiceForm({ locale, onPreview, onLiveChange }: Props) {
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const companyProfile = useMemo(
    () => repositories?.companies.getByUser(user.id) ?? null,
    [repositories, user.id],
  );
  const contacts = useMemo(
    () => repositories?.contacts.list(user.id) ?? [],
    [repositories, user.id],
  );
  const [data, setData] = useState<InvoiceData>(createInvoiceData);
  const [contactQuery, setContactQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>(listCatalogItems);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error">(
    "saved",
  );
  const [deleted, setDeleted] = useState<{
    label: string;
    restore: () => void;
  } | null>(null);
  const [history, setHistory] = useState({ undo: false, redo: false });
  const past = useRef<InvoiceData[]>([]);
  const future = useRef<InvoiceData[]>([]);
  useEffect(() => {
    if (!companyProfile || data.company.name) return;
    const timer = window.setTimeout(
      () =>
        setData((current) => ({
          ...current,
          company: {
            ...current.company,
            name: companyProfile.companyName,
            address: companyProfile.address,
            city: companyProfile.city,
            postalCode: companyProfile.postalCode,
            country: companyProfile.country,
            taxNumber: companyProfile.taxNumber,
            vatNumber: companyProfile.vatNumber,
            phone: companyProfile.phone,
            email: companyProfile.email,
            website: companyProfile.website,
            iban: companyProfile.iban,
            swift: companyProfile.swift,
            bankName: companyProfile.bankName,
          },
          issuePlace: current.issuePlace || companyProfile.city,
          responsiblePerson:
            current.responsiblePerson || companyProfile.responsiblePerson,
          payment: {
            ...current.payment,
            iban: current.payment.iban || companyProfile.iban,
            swift: current.payment.swift || companyProfile.swift,
            bankName: current.payment.bankName || companyProfile.bankName,
          },
          signatures: current.signatures.map((signature, index) =>
            index
              ? signature
              : {
                  ...signature,
                  name: signature.name || companyProfile.responsiblePerson,
                },
          ),
        })),
      0,
    );
    return () => clearTimeout(timer);
  }, [companyProfile, data.company.name]);
  const summary = useMemo(() => calculateInvoice(data), [data]);
  const generated = useMemo<GeneratedDocument>(
    () => ({
      type: "invoice",
      title:
        data.type === "storno"
          ? "STORNO FAKTURA"
          : data.type === "proforma"
            ? "PREDRAČUN"
            : "Faktura",
      locale: data.language || locale,
      fields: [],
      invoice: data,
      totals: {
        subtotal: summary.netCents / 100,
        taxRate: 0,
        tax: summary.taxCents / 100,
        total: summary.totalCents / 100,
      },
      images: {
        logo:
          data.headerLayout === "minimal"
            ? undefined
            : companyProfile?.logoUrl || undefined,
        signature: data.includeSavedSignature
          ? companyProfile?.signatureUrl || undefined
          : undefined,
        stamp: data.includeStamp
          ? companyProfile?.stampUrl || undefined
          : undefined,
      },
    }),
    [companyProfile, data, locale, summary],
  );
  useEffect(() => onLiveChange?.(generated), [generated, onLiveChange]);
  useEffect(() => {
    const statusTimer = window.setTimeout(() => setSaveStatus("saving"), 0);
    const timer = window.setTimeout(() => {
      try {
        saveEditorDraft(generated);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 900);
    return () => {
      clearTimeout(statusTimer);
      clearTimeout(timer);
    };
  }, [generated]);
  const change = useCallback(
    (updater: (current: InvoiceData) => InvoiceData) =>
      setData((current) => {
        past.current = [...past.current.slice(-49), current];
        future.current = [];
        setHistory({ undo: true, redo: false });
        return updater(current);
      }),
    [],
  );
  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) =>
    change((current) => ({ ...current, [key]: value }));
  const undo = () => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(data);
    setData(previous);
    setHistory({ undo: past.current.length > 0, redo: true });
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(data);
    setData(next);
    setHistory({ undo: true, redo: future.current.length > 0 });
  };
  const removeWithUndo = (
    label: string,
    remove: () => void,
    restore: () => void,
  ) => {
    if (!confirm(`Trajno obrisati: ${label}?`)) return;
    remove();
    setDeleted({ label, restore });
    window.setTimeout(() => setDeleted(null), 6000);
  };
  const updateGroup = (
    id: string,
    updater: (group: InvoiceGroup) => InvoiceGroup,
  ) =>
    change((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === id ? updater(group) : group,
      ),
    }));
  const updateItem = (
    groupId: string,
    id: string,
    updater: (item: InvoiceItem) => InvoiceItem,
  ) =>
    updateGroup(groupId, (group) => ({
      ...group,
      items: group.items.map((item) => (item.id === id ? updater(item) : item)),
    }));
  const selectContact = (id: string) => {
    const contact = contacts.find((entry) => entry.id === id);
    if (!contact) return;
    change((current) => ({
      ...current,
      customer: {
        ...current.customer,
        name: contact.companyName || contact.contactName,
        address: contact.address,
        city: contact.city,
        postalCode: contact.postalCode,
        country: contact.country,
        taxNumber: contact.taxNumber,
          vatNumber: "",
        contactPerson: contact.contactName,
        phone: contact.phone,
        email: contact.email,
      },
    }));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/40 p-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!history.undo}
        >
          <Undo2 className="size-4" />
          Undo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!history.redo}
        >
          <Redo2 className="size-4" />
          Redo
        </Button>
        <span
          className={`ml-auto text-xs ${saveStatus === "error" ? "text-red-600" : "text-muted-foreground"}`}
        >
          {saveStatus === "saving"
            ? "Spremanje..."
            : saveStatus === "saved"
              ? "Spremljeno"
              : "Greška pri spremanju"}
        </span>
      </div>
      {deleted && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <span>Obrisano: {deleted.label}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              deleted.restore();
              setDeleted(null);
            }}
          >
            Vrati
          </Button>
        </div>
      )}
      <Section title="Predložak i zaglavlje" open>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Predložak"
            value={data.template}
            options={[
              ["classic", "Klasični"],
              ["modern", "Moderni"],
              ["minimal", "Minimalistički"],
            ]}
            onChange={(value) =>
              set("template", value as InvoiceData["template"])
            }
          />
          <Select
            label="Raspored"
            value={data.headerLayout}
            options={[
              ["logo-left", "Logotip lijevo"],
              ["logo-top", "Logotip gore"],
              ["minimal", "Bez logotipa"],
            ]}
            onChange={(value) =>
              set("headerLayout", value as InvoiceData["headerLayout"])
            }
          />
          <Select
            label="Jezik"
            value={data.language}
            options={[
              ["hr", "Hrvatski"],
              ["en", "English"],
            ]}
            onChange={(value) => set("language", value as "hr" | "en")}
          />
        </div>
      </Section>
      <Section title="Izdavatelj" open>
        <PartyFields
          party={data.company}
          company
          onChange={(company) =>
            set("company", company as InvoiceData["company"])
          }
        />
      </Section>
      <Section title="Kupac" open>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={contactQuery}
              onChange={(event) => setContactQuery(event.target.value)}
              placeholder="Pretraži spremljene kupce"
            />
          </div>
          <select
            className={field}
            onChange={(event) => selectContact(event.target.value)}
            defaultValue=""
          >
            <option value="">Odaberi kontakt</option>
            {contacts
              .filter((contact) =>
                `${contact.companyName} ${contact.contactName} ${contact.email}`
                  .toLowerCase()
                  .includes(contactQuery.toLowerCase()),
              )
              .map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.companyName || contact.contactName}
                </option>
              ))}
          </select>
        </div>
        <PartyFields
          party={data.customer}
          onChange={(customer) => set("customer", customer)}
        />
      </Section>
      <Section title="Podaci fakture" open>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Text
            label="Broj fakture"
            value={data.number}
            onChange={(number) => set("number", number)}
          />
          <Text
            label="Format broja"
            value={data.numberFormat}
            onChange={(numberFormat) => set("numberFormat", numberFormat)}
          />
          <Check
            label="Automatski broj"
            checked={data.automaticNumber}
            onChange={(automaticNumber) =>
              set("automaticNumber", automaticNumber)
            }
          />
          <DateField
            label="Datum izdavanja"
            value={data.issueDate}
            onChange={(issueDate) => set("issueDate", issueDate)}
          />
          <DateField
            label="Datum dospijeća"
            value={data.dueDate}
            onChange={(dueDate) => set("dueDate", dueDate)}
          />
          <DateField
            label="Datum isporuke / usluge"
            value={data.serviceDate}
            onChange={(serviceDate) => set("serviceDate", serviceDate)}
          />
          <Text
            label="Mjesto izdavanja"
            value={data.issuePlace}
            onChange={(issuePlace) => set("issuePlace", issuePlace)}
          />
          <Text
            label="Valuta"
            value={data.currency}
            onChange={(currency) => set("currency", currency)}
          />
          <Select
            label="Status"
            value={data.status}
            options={[
              "nacrt",
              "izdana",
              "poslana",
              "djelimično plaćena",
              "plaćena",
              "dospjela",
              "otkazana",
              "stornirana",
              "arhivirana",
            ].map((v) => [v, v])}
            onChange={(status) =>
              set("status", status as InvoiceData["status"])
            }
          />
          <Select
            label="Vrsta"
            value={data.type}
            options={[
              ["standardna", "Standardna"],
              ["avansna", "Avansna"],
              ["završna", "Završna"],
              ["djelimična", "Djelimična"],
              ["storno", "Storno"],
              ["proforma", "Proforma / predračun"],
              ["bez-pdv", "Bez PDV-a"],
              ["reverse-charge", "Prijenos porezne obveze"],
              ["inozemna", "Inozemna"],
            ]}
            onChange={(type) =>
              change((current) => ({
                ...current,
                type: type as InvoiceData["type"],
                taxMode:
                  type === "bez-pdv"
                    ? "nije-u-pdv"
                    : type === "reverse-charge"
                      ? "reverse-charge"
                      : current.taxMode,
              }))
            }
          />
          <Text
            label="Referenca kupca"
            value={data.customerReference}
            onChange={(customerReference) =>
              set("customerReference", customerReference)
            }
          />
          <Text
            label="Narudžbenica kupca"
            value={data.customerOrderNumber}
            onChange={(customerOrderNumber) =>
              set("customerOrderNumber", customerOrderNumber)
            }
          />
          <Text
            label="Projekt"
            value={data.project}
            onChange={(project) => set("project", project)}
          />
          <Text
            label="Gradilište"
            value={data.site}
            onChange={(site) => set("site", site)}
          />
          <Text
            label="Odgovorna osoba"
            value={data.responsiblePerson}
            onChange={(responsiblePerson) =>
              set("responsiblePerson", responsiblePerson)
            }
          />
        </div>
        <label className="mt-3 block text-xs font-medium">
          Napomena
          <textarea
            className={textarea}
            value={data.note}
            onChange={(event) => set("note", event.target.value)}
          />
        </label>
      </Section>
      <Section title="Grupe i stavke" open>
        <div className="space-y-3">
          {data.groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-2xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <GripVertical className="size-4 text-muted-foreground" />
                <Input
                  className="min-w-40 flex-1"
                  value={group.name}
                  onChange={(event) =>
                    updateGroup(group.id, (value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                />
                <NumberField
                  label="Popust grupe %"
                  value={group.discountRate}
                  onChange={(discountRate) =>
                    updateGroup(group.id, (value) => ({
                      ...value,
                      discountRate,
                    }))
                  }
                />
                <IconButton
                  label="Sakrij/prikaži"
                  onClick={() =>
                    updateGroup(group.id, (value) => ({
                      ...value,
                      visible: !value.visible,
                    }))
                  }
                >
                  {group.visible ? <Eye /> : <EyeOff />}
                </IconButton>
                <IconButton
                  label="Dupliraj grupu"
                  onClick={() =>
                    change((current) => ({
                      ...current,
                      groups: [
                        ...current.groups.slice(0, groupIndex + 1),
                        clone(group),
                        ...current.groups.slice(groupIndex + 1),
                      ],
                    }))
                  }
                >
                  <Copy />
                </IconButton>
                <IconButton
                  label="Gore"
                  onClick={() =>
                    set("groups", move(data.groups, groupIndex, -1))
                  }
                >
                  ↑
                </IconButton>
                <IconButton
                  label="Dolje"
                  onClick={() =>
                    set("groups", move(data.groups, groupIndex, 1))
                  }
                >
                  ↓
                </IconButton>
                <IconButton
                  label="Otvori/zatvori"
                  onClick={() =>
                    updateGroup(group.id, (value) => ({
                      ...value,
                      collapsed: !value.collapsed,
                    }))
                  }
                >
                  <ChevronDown />
                </IconButton>
                <IconButton
                  label="Obriši grupu"
                  onClick={() =>
                    removeWithUndo(
                      group.name,
                      () =>
                        set(
                          "groups",
                          data.groups.filter((value) => value.id !== group.id),
                        ),
                      () =>
                        set("groups", [
                          ...data.groups.slice(0, groupIndex),
                          group,
                          ...data.groups.slice(groupIndex),
                        ]),
                    )
                  }
                >
                  <Trash2 />
                </IconButton>
              </div>
              {!group.collapsed && (
                <div className="mt-3 space-y-3">
                  {group.items.map((item, itemIndex) => (
                    <ItemEditor
                      key={item.id}
                      item={item}
                      groups={data.groups}
                      onChange={(next) =>
                        updateItem(group.id, item.id, () => next)
                      }
                      onMove={(target) =>
                        change((current) => ({
                          ...current,
                          groups: current.groups.map((value) =>
                            value.id === group.id
                              ? {
                                  ...value,
                                  items: value.items.filter(
                                    (entry) => entry.id !== item.id,
                                  ),
                                }
                              : value.id === target
                                ? { ...value, items: [...value.items, item] }
                                : value,
                          ),
                        }))
                      }
                      onDuplicate={() =>
                        updateGroup(group.id, (value) => ({
                          ...value,
                          items: [
                            ...value.items.slice(0, itemIndex + 1),
                            clone(item),
                            ...value.items.slice(itemIndex + 1),
                          ],
                        }))
                      }
                      onUp={() =>
                        updateGroup(group.id, (value) => ({
                          ...value,
                          items: move(value.items, itemIndex, -1),
                        }))
                      }
                      onDown={() =>
                        updateGroup(group.id, (value) => ({
                          ...value,
                          items: move(value.items, itemIndex, 1),
                        }))
                      }
                      onDelete={() =>
                        removeWithUndo(
                          item.name,
                          () =>
                            updateGroup(group.id, (value) => ({
                              ...value,
                              items: value.items.filter(
                                (entry) => entry.id !== item.id,
                              ),
                            })),
                          () =>
                            updateGroup(group.id, (value) => ({
                              ...value,
                              items: [
                                ...value.items.slice(0, itemIndex),
                                item,
                                ...value.items.slice(itemIndex),
                              ],
                            })),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateGroup(group.id, (value) => ({
                        ...value,
                        items: [...value.items, createInvoiceItem()],
                      }))
                    }
                  >
                    <Plus className="size-4" />
                    Dodaj stavku
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set("groups", [...data.groups, createInvoiceGroup("Nova grupa")])
            }
          >
            <Plus className="size-4" />
            Dodaj grupu
          </Button>
        </div>
      </Section>
      <CatalogSection
        catalog={catalog}
        query={catalogQuery}
        setQuery={setCatalogQuery}
        onChange={(next) => {
          setCatalog(next);
          saveCatalogItems(next);
        }}
        onSelect={(entry) => {
          const group = data.groups[0];
          if (!group) return;
          updateGroup(group.id, (g) => ({
            ...g,
            items: [
              ...g.items,
              {
                ...createInvoiceItem(),
                code: entry.code,
                name: entry.name,
                description: entry.description,
                unit: entry.unit,
                unitPrice: entry.unitPrice,
                taxRate: entry.taxRate,
              },
            ],
          }));
        }}
      />
      <Section title="Popusti, naknade i porezi">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Globalni popust %"
            value={data.globalDiscountRate}
            onChange={(globalDiscountRate) =>
              set("globalDiscountRate", globalDiscountRate)
            }
          />
          <Select
            label="Porezni režim"
            value={data.taxMode}
            options={[
              ["standard", "Standardni PDV"],
              ["nije-u-pdv", "Nije u sustavu PDV-a"],
              ["oslobođeno", "Oslobođeno PDV-a"],
              ["reverse-charge", "Prijenos porezne obveze"],
              ["izvoz", "Izvoz"],
              ["eu", "Unutar EU"],
              ["prilagođeno", "Prilagođeno"],
            ]}
            onChange={(taxMode) =>
              change((c) => ({
                ...c,
                taxMode: taxMode as InvoiceData["taxMode"],
                legalNote: suggestedLegalNote(
                  taxMode as InvoiceData["taxMode"],
                ),
              }))
            }
          />
        </div>
        <div className="mt-3 space-y-2">
          {data.charges.map((charge, index) => (
            <ChargeEditor
              key={charge.id}
              charge={charge}
              onChange={(next) =>
                set(
                  "charges",
                  data.charges.map((v) => (v.id === charge.id ? next : v)),
                )
              }
              onDuplicate={() =>
                set("charges", [
                  ...data.charges.slice(0, index + 1),
                  clone(charge),
                  ...data.charges.slice(index + 1),
                ])
              }
              onMove={(d) => set("charges", move(data.charges, index, d))}
              onDelete={() =>
                set(
                  "charges",
                  data.charges.filter((v) => v.id !== charge.id),
                )
              }
            />
          ))}
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              set("charges", [
                ...data.charges,
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
            Dodaj naknadu
          </Button>
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Provjerite porezni i pravni tekst prije izdavanja fakture.
        </div>
        <Check
          label="Prikaži pravnu napomenu"
          checked={data.showLegalNote}
          onChange={(showLegalNote) => set("showLegalNote", showLegalNote)}
        />
        <textarea
          className={textarea}
          value={data.legalNote}
          onChange={(event) => set("legalNote", event.target.value)}
          placeholder="Pravna / porezna napomena"
        />
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            localStorage.setItem("dokument-ai-tax-note", data.legalNote)
          }
        >
          Spremi kao predložak
        </Button>
      </Section>
      <Section title="Plaćanje i uplate">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              "iban",
              "swift",
              "bankName",
              "model",
              "reference",
              "description",
              "deadline",
            ] as const
          ).map((key) => (
            <Text
              key={key}
              label={
                {
                  iban: "IBAN",
                  swift: "SWIFT",
                  bankName: "Banka",
                  model: "Model",
                  reference: "Poziv na broj",
                  description: "Opis plaćanja",
                  deadline: "Rok plaćanja",
                }[key]
              }
              value={data.payment[key]}
              onChange={(value) =>
                set("payment", { ...data.payment, [key]: value })
              }
            />
          ))}
          <Select
            label="Način plaćanja"
            value={data.payment.method}
            options={[
              "bankovna uplata",
              "gotovina",
              "kartica",
              "pouzeće",
              "PayPal",
              "drugo",
            ].map((v) => [v, v])}
            onChange={(method) =>
              set("payment", {
                ...data.payment,
                method: method as InvoiceData["payment"]["method"],
              })
            }
          />
          <Check
            label="Mjesto za budući 2D/QR kod"
            checked={data.payment.showCodePlaceholder}
            onChange={(showCodePlaceholder) =>
              set("payment", { ...data.payment, showCodePlaceholder })
            }
          />
        </div>
        <div className="mt-4 space-y-2">
            {data.payments.map((payment) => (
            <PaymentEditor
              key={payment.id}
              payment={payment}
              onChange={(next) =>
                set(
                  "payments",
                  data.payments.map((v) => (v.id === payment.id ? next : v)),
                )
              }
              onDuplicate={() =>
                set("payments", [...data.payments, clone(payment)])
              }
              onDelete={() =>
                set(
                  "payments",
                  data.payments.filter((v) => v.id !== payment.id),
                )
              }
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set("payments", [
                ...data.payments,
                {
                  id: crypto.randomUUID(),
                  date: data.issueDate,
                  amount: 0,
                  method: "bankovna uplata",
                  reference: "",
                  note: "",
                },
              ])
            }
          >
            <Plus className="size-4" />
            Evidentiraj uplatu
          </Button>
        </div>
      </Section>
      {(data.type === "avansna" || data.type === "završna") && (
        <Section title="Avans i završni obračun" open>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Postotak avansa"
              value={data.advancePercentage}
              onChange={(advancePercentage) =>
                set("advancePercentage", advancePercentage)
              }
            />
            <NumberField
              label="Iznos avansa"
              value={data.advanceAmount}
              onChange={(advanceAmount) => set("advanceAmount", advanceAmount)}
            />
            <Text
              label="Referenca ponude / ugovora"
              value={data.advanceReference}
              onChange={(advanceReference) =>
                set("advanceReference", advanceReference)
              }
            />
            <NumberField
              label="Odbitak prethodnog avansa"
              value={data.previousAdvance}
              onChange={(previousAdvance) =>
                set("previousAdvance", previousAdvance)
              }
            />
          </div>
        </Section>
      )}
      {data.type === "storno" && (
        <Section title="Storno podaci" open>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text
              label="Originalni broj fakture"
              value={data.cancelledInvoiceNumber}
              onChange={(cancelledInvoiceNumber) =>
                set("cancelledInvoiceNumber", cancelledInvoiceNumber)
              }
            />
            <DateField
              label="Datum storna"
              value={data.cancellationDate}
              onChange={(cancellationDate) =>
                set("cancellationDate", cancellationDate)
              }
            />
            <Text
              label="Razlog storna"
              value={data.cancellationReason}
              onChange={(cancellationReason) =>
                set("cancellationReason", cancellationReason)
              }
            />
            <Check
              label="Djelimični storno"
              checked={data.partialCancellation}
              onChange={(partialCancellation) =>
                set("partialCancellation", partialCancellation)
              }
            />
          </div>
          <Button
            className="mt-3"
            type="button"
            variant="outline"
            onClick={() =>
              change((c) => ({
                ...c,
                groups: c.groups.map((g) => ({
                  ...g,
                  items: g.items.map((i) => ({
                    ...i,
                    quantity: -Math.abs(i.quantity),
                  })),
                })),
              }))
            }
          >
            Kreiraj negativne stavke
          </Button>
        </Section>
      )}
      <BlocksSection
        blocks={data.blocks}
        onChange={(blocks) => set("blocks", blocks)}
      />
      <SignaturesSection
        signatures={data.signatures}
        onChange={(signatures) => set("signatures", signatures)}
        includeSignature={data.includeSavedSignature}
        includeStamp={data.includeStamp}
        setIncludeSignature={(includeSavedSignature) =>
          set("includeSavedSignature", includeSavedSignature)
        }
        setIncludeStamp={(includeStamp) => set("includeStamp", includeStamp)}
      />
      <div className="sticky bottom-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <strong>
            Osnovica {(summary.netCents / 100).toFixed(2)} {data.currency}
          </strong>
          <span>PDV {(summary.taxCents / 100).toFixed(2)}</span>
          <span>Plaćeno {(summary.paidCents / 100).toFixed(2)}</span>
          <strong>Za uplatu {(summary.remainingCents / 100).toFixed(2)}</strong>
        </div>
        <Button
          className="w-full"
          type="button"
          onClick={() => onPreview(generated)}
        >
          Pregled i preuzimanje
        </Button>
      </div>
    </div>
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
    <details open={open} className="group rounded-2xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
        {title}
        <ChevronDown className="size-4 transition group-open:rotate-180" />
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 text-xs font-medium">
      {label}
      <input
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <input
        type="date"
        className={field}
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
  onChange: (value: number) => void;
}) {
  return (
    <label className="block min-w-24 text-xs font-medium">
      {label}
      <input
        type="number"
        step="0.01"
        className={field}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <select
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 self-end rounded-xl border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
function PartyFields({
  party,
  company = false,
  onChange,
}: {
  party: InvoiceData["customer"] | InvoiceData["company"];
  company?: boolean;
  onChange: (party: InvoiceData["customer"] | InvoiceData["company"]) => void;
}) {
  const keys = [
    "name",
    "address",
    "city",
    "postalCode",
    "country",
    "taxNumber",
    "vatNumber",
    "contactPerson",
    "phone",
    "email",
    ...(company
      ? ["registrationNumber", "website", "iban", "swift", "bankName"]
      : []),
  ] as const;
  const labels: Record<string, string> = {
    name: "Naziv / ime",
    address: "Adresa",
    city: "Grad",
    postalCode: "Poštanski broj",
    country: "Država",
    taxNumber: "OIB / PIB",
    vatNumber: "PDV broj",
    contactPerson: "Kontakt osoba",
    phone: "Telefon",
    email: "Email",
    registrationNumber: "Matični broj",
    website: "Web",
    iban: "IBAN",
    swift: "SWIFT",
    bankName: "Banka",
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((key) => (
        <div key={key} className="flex items-end gap-1">
          <Text
            label={labels[key]}
            value={String(party[key as keyof typeof party] ?? "")}
            onChange={(value) => onChange({ ...party, [key]: value })}
          />
          {company && (
            <IconButton
              label="Sakrij/prikaži polje"
              onClick={() => {
                const current = party as InvoiceData["company"];
                onChange({
                  ...current,
                  visible: { ...current.visible, [key]: !current.visible[key] },
                });
              }}
            >
              {(party as InvoiceData["company"]).visible[key] ? (
                <Eye />
              ) : (
                <EyeOff />
              )}
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
}
function ItemEditor({
  item,
  groups,
  onChange,
  onMove,
  onDuplicate,
  onUp,
  onDown,
  onDelete,
}: {
  item: InvoiceItem;
  groups: InvoiceGroup[];
  onChange: (v: InvoiceItem) => void;
  onMove: (id: string) => void;
  onDuplicate: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Text
          label="Šifra"
          value={item.code}
          onChange={(code) => onChange({ ...item, code })}
        />
        <Text
          label="Naziv"
          value={item.name}
          onChange={(name) => onChange({ ...item, name })}
        />
        <NumberField
          label="Količina"
          value={item.quantity}
          onChange={(quantity) => onChange({ ...item, quantity })}
        />
        <label className="text-xs font-medium">
          Jedinica
          <input
            list={`units-${item.id}`}
            className={field}
            value={item.unit}
            onChange={(e) => onChange({ ...item, unit: e.target.value })}
          />
          <datalist id={`units-${item.id}`}>
            {invoiceUnits.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
        </label>
        <NumberField
          label="Cijena"
          value={item.unitPrice}
          onChange={(unitPrice) => onChange({ ...item, unitPrice })}
        />
        <NumberField
          label="Popust %"
          value={item.discountRate}
          onChange={(discountRate) => onChange({ ...item, discountRate })}
        />
        <label className="text-xs font-medium">
          PDV %
          <input
            list={`tax-${item.id}`}
            type="number"
            className={field}
            value={item.taxRate}
            onChange={(e) =>
              onChange({ ...item, taxRate: Number(e.target.value) })
            }
          />
          <datalist id={`tax-${item.id}`}>
            {invoiceTaxRates.map((tax) => (
              <option key={tax} value={tax} />
            ))}
          </datalist>
        </label>
        <select
          className={field}
          value=""
          onChange={(e) => {
            if (e.target.value) onMove(e.target.value);
          }}
        >
          <option value="">Premjesti u grupu…</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className={`${textarea} mt-2`}
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        placeholder="Detaljan opis"
      />
      <Text
        label="Napomena stavke"
        value={item.note}
        onChange={(note) => onChange({ ...item, note })}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Check
          label="U izračunu"
          checked={item.includedInCalculation}
          onChange={(includedInCalculation) =>
            onChange({ ...item, includedInCalculation })
          }
        />
        <Check
          label="U dokumentu"
          checked={item.visible}
          onChange={(visible) => onChange({ ...item, visible })}
        />
        <IconButton label="Dupliraj" onClick={onDuplicate}>
          <Copy />
        </IconButton>
        <IconButton label="Gore" onClick={onUp}>
          ↑
        </IconButton>
        <IconButton label="Dolje" onClick={onDown}>
          ↓
        </IconButton>
        <IconButton label="Obriši" onClick={onDelete}>
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
}
function ChargeEditor({
  charge,
  onChange,
  onDuplicate,
  onMove,
  onDelete,
}: {
  charge: InvoiceCharge;
  onChange: (v: InvoiceCharge) => void;
  onDuplicate: () => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-xl bg-muted/40 p-2 sm:grid-cols-[1fr_120px_100px_auto]">
      <Text
        label="Naziv"
        value={charge.name}
        onChange={(name) => onChange({ ...charge, name })}
      />
      <NumberField
        label="Iznos"
        value={charge.amount}
        onChange={(amount) => onChange({ ...charge, amount })}
      />
      <NumberField
        label="PDV %"
        value={charge.taxRate}
        onChange={(taxRate) => onChange({ ...charge, taxRate })}
      />
      <div className="flex items-end gap-1">
        <IconButton
          label="Uključi"
          onClick={() =>
            onChange({
              ...charge,
              includedInCalculation: !charge.includedInCalculation,
            })
          }
        >
          {charge.includedInCalculation ? <Eye /> : <EyeOff />}
        </IconButton>
        <IconButton
          label="Prikaži"
          onClick={() => onChange({ ...charge, visible: !charge.visible })}
        >
          {charge.visible ? <Eye /> : <EyeOff />}
        </IconButton>
        <IconButton label="Dupliraj" onClick={onDuplicate}>
          <Copy />
        </IconButton>
        <IconButton label="Gore" onClick={() => onMove(-1)}>
          ↑
        </IconButton>
        <IconButton label="Dolje" onClick={() => onMove(1)}>
          ↓
        </IconButton>
        <IconButton label="Obriši" onClick={onDelete}>
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
}
function PaymentEditor({
  payment,
  onChange,
  onDuplicate,
  onDelete,
}: {
  payment: InvoicePayment;
  onChange: (v: InvoicePayment) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-xl bg-muted/40 p-2 sm:grid-cols-2 lg:grid-cols-5">
      <DateField
        label="Datum"
        value={payment.date}
        onChange={(date) => onChange({ ...payment, date })}
      />
      <NumberField
        label="Iznos"
        value={payment.amount}
        onChange={(amount) => onChange({ ...payment, amount })}
      />
      <Select
        label="Način"
        value={payment.method}
        options={[
          "bankovna uplata",
          "gotovina",
          "kartica",
          "pouzeće",
          "PayPal",
          "drugo",
        ].map((v) => [v, v])}
        onChange={(method) =>
          onChange({ ...payment, method: method as InvoicePayment["method"] })
        }
      />
      <Text
        label="Referenca / napomena"
        value={[payment.reference, payment.note].filter(Boolean).join(" · ")}
        onChange={(note) => onChange({ ...payment, note })}
      />
      <div className="flex items-end gap-1">
        <IconButton label="Dupliraj" onClick={onDuplicate}>
          <Copy />
        </IconButton>
        <IconButton label="Obriši" onClick={onDelete}>
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
}
function CatalogSection({
  catalog,
  query,
  setQuery,
  onChange,
  onSelect,
}: {
  catalog: CatalogItem[];
  query: string;
  setQuery: (v: string) => void;
  onChange: (v: CatalogItem[]) => void;
  onSelect: (v: CatalogItem) => void;
}) {
  const filtered = catalog.filter((v) =>
    `${v.code} ${v.name} ${v.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Section title="Baza artikala i usluga">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pretraži artikle, usluge ili kategorije"
      />
      <div className="mt-3 space-y-2">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border p-2 text-sm"
          >
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => onSelect(entry)}
            >
              <strong>
                {entry.code} · {entry.name}
              </strong>
              <span className="ml-2 text-muted-foreground">
                {entry.unitPrice.toFixed(2)} / {entry.unit}
              </span>
            </button>
            <IconButton
              label="Aktiviraj/deaktiviraj"
              onClick={() =>
                onChange(
                  catalog.map((v) =>
                    v.id === entry.id ? { ...v, active: !v.active } : v,
                  ),
                )
              }
            >
              {entry.active ? <Eye /> : <EyeOff />}
            </IconButton>
            <IconButton
              label="Dupliraj"
              onClick={() => onChange([...catalog, clone(entry)])}
            >
              <Copy />
            </IconButton>
            <IconButton
              label="Obriši"
              onClick={() => onChange(catalog.filter((v) => v.id !== entry.id))}
            >
              <Trash2 />
            </IconButton>
          </div>
        ))}
      </div>
      <Button
        className="mt-3"
        variant="outline"
        type="button"
        onClick={() =>
          onChange([
            ...catalog,
            {
              id: crypto.randomUUID(),
              code: "NOVO",
              name: "Novi artikl",
              description: "",
              unit: "kom",
              unitPrice: 0,
              taxRate: 25,
              category: "Drugo",
              active: true,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj zapis
      </Button>
    </Section>
  );
}
function BlocksSection({
  blocks,
  onChange,
}: {
  blocks: InvoiceBlock[];
  onChange: (v: InvoiceBlock[]) => void;
}) {
  return (
    <Section title="Tekstualne sekcije">
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-xl border p-3">
            <div className="flex gap-2">
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
              <IconButton
                label="Dupliraj"
                onClick={() =>
                  onChange([
                    ...blocks.slice(0, index + 1),
                    clone(block),
                    ...blocks.slice(index + 1),
                  ])
                }
              >
                <Copy />
              </IconButton>
              <IconButton
                label="Gore"
                onClick={() => onChange(move(blocks, index, -1))}
              >
                ↑
              </IconButton>
              <IconButton
                label="Dolje"
                onClick={() => onChange(move(blocks, index, 1))}
              >
                ↓
              </IconButton>
              <IconButton
                label="Obriši"
                onClick={() =>
                  onChange(blocks.filter((v) => v.id !== block.id))
                }
              >
                <Trash2 />
              </IconButton>
            </div>
            <textarea
              className={`${textarea} mt-2`}
              value={block.content}
              onChange={(e) =>
                onChange(
                  blocks.map((v) =>
                    v.id === block.id ? { ...v, content: e.target.value } : v,
                  ),
                )
              }
            />
            <div className="mt-2 flex gap-2">
              <Check
                label="Prikaži u izvozu"
                checked={block.visible}
                onChange={(visible) =>
                  onChange(
                    blocks.map((v) =>
                      v.id === block.id ? { ...v, visible } : v,
                    ),
                  )
                }
              />
              <Check
                label="Interna napomena"
                checked={block.internal}
                onChange={(internal) =>
                  onChange(
                    blocks.map((v) =>
                      v.id === block.id ? { ...v, internal } : v,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        className="mt-3"
        variant="outline"
        type="button"
        onClick={() =>
          onChange([
            ...blocks,
            {
              id: crypto.randomUUID(),
              title: "Napomena kupcu",
              content: "",
              visible: true,
              internal: false,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Dodaj tekstualni blok
      </Button>
    </Section>
  );
}
function SignaturesSection({
  signatures,
  onChange,
  includeSignature,
  includeStamp,
  setIncludeSignature,
  setIncludeStamp,
}: {
  signatures: InvoiceSignature[];
  onChange: (v: InvoiceSignature[]) => void;
  includeSignature: boolean;
  includeStamp: boolean;
  setIncludeSignature: (v: boolean) => void;
  setIncludeStamp: (v: boolean) => void;
}) {
  return (
    <Section title="Potpis i pečat">
      <div className="space-y-2">
        {signatures.map((signature, index) => (
          <div
            key={signature.id}
            className="grid gap-2 rounded-xl border p-2 sm:grid-cols-3"
          >
            <Text
              label="Naslov"
              value={signature.title}
              onChange={(title) =>
                onChange(
                  signatures.map((v) =>
                    v.id === signature.id ? { ...v, title } : v,
                  ),
                )
              }
            />
            <Text
              label="Ime i prezime"
              value={signature.name}
              onChange={(name) =>
                onChange(
                  signatures.map((v) =>
                    v.id === signature.id ? { ...v, name } : v,
                  ),
                )
              }
            />
            <Text
              label="Funkcija"
              value={signature.role}
              onChange={(role) =>
                onChange(
                  signatures.map((v) =>
                    v.id === signature.id ? { ...v, role } : v,
                  ),
                )
              }
            />
            <DateField
              label="Datum"
              value={signature.date}
              onChange={(date) =>
                onChange(
                  signatures.map((v) =>
                    v.id === signature.id ? { ...v, date } : v,
                  ),
                )
              }
            />
            <div className="flex items-end gap-1">
              <IconButton
                label="Sakrij/prikaži"
                onClick={() =>
                  onChange(
                    signatures.map((v) =>
                      v.id === signature.id ? { ...v, visible: !v.visible } : v,
                    ),
                  )
                }
              >
                {signature.visible ? <Eye /> : <EyeOff />}
              </IconButton>
              <IconButton
                label="Dupliraj"
                onClick={() => onChange([...signatures, clone(signature)])}
              >
                <Copy />
              </IconButton>
              <IconButton
                label="Gore"
                onClick={() => onChange(move(signatures, index, -1))}
              >
                ↑
              </IconButton>
              <IconButton
                label="Dolje"
                onClick={() => onChange(move(signatures, index, 1))}
              >
                ↓
              </IconButton>
              <IconButton
                label="Obriši"
                onClick={() =>
                  onChange(signatures.filter((v) => v.id !== signature.id))
                }
              >
                <Trash2 />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Check
          label="Uključi spremljeni potpis"
          checked={includeSignature}
          onChange={setIncludeSignature}
        />
        <Check
          label="Uključi pečat"
          checked={includeStamp}
          onChange={setIncludeStamp}
        />
        <Button
          variant="outline"
          type="button"
          onClick={() =>
            onChange([
              ...signatures,
              {
                id: crypto.randomUUID(),
                title: "Potpis",
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
    </Section>
  );
}
