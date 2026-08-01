import type { DocumentType } from "@/lib/document-types";
import type { GeneratedDocument } from "@/lib/generated-document";
import { completedWorksFields } from "@/lib/completed-works-report";
import { handoverFields } from "@/lib/work-handover";

export type FieldVisibility = { isVisible: boolean };
export type SectionVisibility = {
  isVisible: boolean;
  fields: Record<string, FieldVisibility>;
};
export type ColumnVisibility = {
  id: string;
  label: string;
  isVisible: boolean;
  order: number;
};
export type ItemVisibility = {
  isVisible: boolean;
  includeInCalculation: boolean;
};
export type GroupVisibility = {
  isVisible: boolean;
  includeInCalculation: boolean;
  showTitle: boolean;
  showSubtotal: boolean;
};
export type DocumentVisibilitySettings = {
  version: 1;
  profileId: string;
  sections: Record<string, SectionVisibility>;
  columns: ColumnVisibility[];
  items: Record<string, ItemVisibility>;
  groups: Record<string, GroupVisibility>;
};
export type VisibilityProfile = {
  id: string;
  name: string;
  documentType: DocumentType | "all";
  settings: DocumentVisibilitySettings;
  builtIn?: boolean;
  isDefault?: boolean;
};

export const sectionLabels: Record<string, string> = {
  company: "Podaci firme",
  customer: "Kupac",
  supplier: "Dobavljač",
  document: "Podaci dokumenta",
  fields: "Sadržaj dokumenta",
  items: "Stavke",
  financials: "Financijska rekapitulacija",
  payment: "Podaci za plaćanje",
  delivery: "Uvjeti isporuke",
  notes: "Napomena",
  signatures: "Potpisi",
  stamp: "Pečat",
  logo: "Logotip",
  blocks: "Dodatni tekstovi",
  acceptance: "Prihvat ponude",
  payments: "Evidencija uplata",
  taxNotes: "Porezne napomene",
  weather: "Vrijeme", workforce: "Radnici", completedWorks: "Izvedeni radovi", plannedWorks: "Planirani radovi", materials: "Materijal", equipment: "Strojevi", deliveries: "Dostave", problems: "Problemi i zastoji", quality: "Kvaliteta", safety: "Sigurnost", visitors: "Posjetitelji", meetings: "Sastanci", photos: "Fotografije", attachments: "Prilozi", custom: "Prilagođene sekcije",
  intro: "Uvodni tekst", phases: "Faze", works: "Izvedeni radovi", additionalWorks: "Dodatni radovi", defects: "Nedostaci", deductions: "Odbici", conclusion: "Zaključak",
  participants: "Sudionici", subject: "Predmet primopredaje", groups: "Grupe radova", deadlines: "Rokovi", documentation: "Dokumentacija", tests: "Ispitivanja", cleaning: "Čišćenje", warranty: "Jamstvo", statements: "Izjave", outcome: "Ishod", reinspection: "Ponovni pregled",
};
const columnDefaults: ColumnVisibility[] = [
  ["index", "Redni broj"],
  ["code", "Šifra"],
  ["name", "Naziv"],
  ["description", "Opis"],
  ["quantity", "Količina"],
  ["unit", "Jedinica mjere"],
  ["price", "Cijena"],
  ["discount", "Popust"],
  ["tax", "PDV"],
  ["net", "Ukupno bez PDV-a"],
  ["total", "Ukupno s PDV-om"],
  ["note", "Napomena"],
].map(([id, label], order) => ({
  id,
  label,
  order,
  isVisible: !["net", "note"].includes(id),
}));
const section = (fields: string[] = []): SectionVisibility => ({
  isVisible: true,
  fields: Object.fromEntries(fields.map((id) => [id, { isVisible: true }])),
});
const partyFields = [
  "name",
  "address",
  "city",
  "postalCode",
  "cityPostalCode",
  "country",
  "taxNumber",
  "vatNumber",
  "registrationNumber",
  "contactPerson",
  "phone",
  "email",
  "website",
  "iban",
  "swift",
  "bankName",
];
const documentFields = [
  "number",
  "orderNumber",
  "issueDate",
  "dueDate",
  "validUntil",
  "expectedPaymentDate",
  "serviceDate",
  "issuePlace",
  "desiredDeliveryDate",
  "deliveryPlace",
  "deliveryMethod",
  "paymentDeadline",
  "paymentMethod",
  "currency",
  "reference",
  "customerReference",
  "customerOrderNumber",
  "displayTitle",
  "disclaimer",
  "project",
  "site",
  "responsiblePerson",
  "status",
  "issueDate",
  "periodFrom",
  "periodTo",
  "projectName",
  "siteName",
  "siteAddress",
  "investor",
  "customer",
  "mainContractor",
  "subcontractor",
  "supervision",
  "siteManager",
  "foreman",
  "contractNumber",
  "workOrderNumber",
  "offerNumber",
  "projectPhase",
];

export function createDefaultVisibility(
  document?: GeneratedDocument,
): DocumentVisibilitySettings {
  const sections: Record<string, SectionVisibility> = {
    company: section(partyFields),
    customer: section(partyFields),
    supplier: section(partyFields),
    document: section(documentFields),
    fields: section(
      document?.fields.map((field) => fieldId(field.label)) ?? [],
    ),
    items: section(),
    financials: section(),
    payment: section(),
    delivery: section(),
    notes: section(),
    signatures: section(),
    stamp: section(),
    logo: section(),
    blocks: section(),
    acceptance: section(),
    payments: section(),
    taxNotes: section(),
  };
  if (document?.dailyReport)
    for (const id of Object.keys(document.dailyReport.sections))
      sections[id] = section();
  if (document?.completedWorksReport)
    for (const id of [...Object.keys(document.completedWorksReport.sections), "phases", "photos"])
      sections[id] = section(
        id in completedWorksFields
          ? completedWorksFields[id as keyof typeof completedWorksFields].map(fieldId)
          : [],
      );
  if (document?.workHandover)
    for (const id of [...Object.keys(document.workHandover.sections), "photos"])
      sections[id] = section(id in handoverFields ? handoverFields[id as keyof typeof handoverFields].map(fieldId) : []);
  return {
    version: 1,
    profileId: "full",
    sections,
    columns: columnDefaults.map((entry) => ({ ...entry })),
    items: {},
    groups: {},
  };
}
export function fieldId(label: string) {
  return label
    .toLocaleLowerCase("hr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function normalizeDocumentVisibility(
  document: GeneratedDocument,
): DocumentVisibilitySettings {
  const defaults = createDefaultVisibility(document);
  const saved = document.visibility;
  if (!saved) return defaults;
  const sections = { ...defaults.sections };
  for (const [id, value] of Object.entries(saved.sections ?? {}))
    sections[id] = {
      isVisible: value.isVisible ?? true,
      fields: {
        ...(defaults.sections[id]?.fields ?? {}),
        ...(value.fields ?? {}),
      },
    };
  const columns = columnDefaults
    .map((entry) => ({
      ...entry,
      ...(saved.columns?.find((column) => column.id === entry.id) ?? {}),
    }))
    .sort((a, b) => a.order - b.order);
  return {
    version: 1,
    profileId: saved.profileId || "custom",
    sections,
    columns,
    items: saved.items ?? {},
    groups: saved.groups ?? {},
  };
}
export const isSectionVisible = (
  settings: DocumentVisibilitySettings,
  id: string,
) => settings.sections[id]?.isVisible !== false;
export const isFieldVisible = (
  settings: DocumentVisibilitySettings,
  sectionId: string,
  id: string,
) =>
  isSectionVisible(settings, sectionId) &&
  settings.sections[sectionId]?.fields[id]?.isVisible !== false;
export const isColumnVisible = (
  settings: DocumentVisibilitySettings,
  id: string,
) => settings.columns.find((column) => column.id === id)?.isVisible !== false;

function blankHidden<T extends Record<string, unknown>>(
  value: T,
  settings: DocumentVisibilitySettings,
  sectionId: string,
): T {
  if (!isSectionVisible(settings, sectionId))
    return Object.fromEntries(
      Object.keys(value).map((key) => [
        key,
        key === "visible" ? value[key] : "",
      ]),
    ) as T;
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key,
      key === "visible" || isFieldVisible(settings, sectionId, key)
        ? field
        : "",
    ]),
  ) as T;
}
export function buildVisibleDocumentModel(
  source: GeneratedDocument,
): GeneratedDocument {
  const document = structuredClone(source);
  const settings = normalizeDocumentVisibility(document);
  document.visibility = settings;
  document.fields = isSectionVisible(settings, "fields")
    ? document.fields.filter((field) =>
        isFieldVisible(settings, "fields", fieldId(field.label)),
      )
    : [];
  if (!isSectionVisible(settings, "items")) document.items = [];
  else
    document.items = document.items?.filter(
      (_, index) => settings.items[String(index)]?.isVisible !== false,
    );
  if (!isSectionVisible(settings, "financials")) document.totals = undefined;
  if (!isSectionVisible(settings, "logo"))
    document.images = { ...document.images, logo: undefined };
  if (!isSectionVisible(settings, "signatures"))
    document.images = { ...document.images, signature: undefined };
  if (!isSectionVisible(settings, "stamp"))
    document.images = { ...document.images, stamp: undefined };
  if (document.invoice) {
    const data = document.invoice;
    for (const key of documentFields)
      if (key in data && !isFieldVisible(settings, "document", key))
        (data as unknown as Record<string, unknown>)[key] = "";
    data.company = blankHidden(
      data.company as unknown as Record<string, unknown>,
      settings,
      "company",
    ) as unknown as typeof data.company;
    data.customer = blankHidden(
      data.customer as unknown as Record<string, unknown>,
      settings,
      "customer",
    ) as unknown as typeof data.customer;
    data.groups = data.groups.map((group) => {
      const groupSetting = settings.groups[group.id];
      return {
        ...group,
        visible:
          isSectionVisible(settings, "items") &&
          (groupSetting?.isVisible ?? group.visible),
        items: group.items.map((item) => ({
          ...item,
          visible: settings.items[item.id]?.isVisible ?? item.visible,
          includedInCalculation:
            groupSetting?.includeInCalculation === false
              ? false
              : (settings.items[item.id]?.includeInCalculation ??
                item.includedInCalculation),
        })),
      };
    });
    data.showFinancials =
      isSectionVisible(settings, "financials") &&
      isColumnVisible(settings, "price");
    if (!data.showFinancials) data.charges = [];
    if (!isSectionVisible(settings, "payment"))
      data.payment = {
        ...data.payment,
        iban: "",
        swift: "",
        bankName: "",
        model: "",
        reference: "",
        description: "",
        deadline: "",
        showCodePlaceholder: false,
      };
    if (!isSectionVisible(settings, "payments")) {
      data.payments = [];
      data.installments = [];
    }
    if (!isSectionVisible(settings, "taxNotes")) data.showLegalNote = false;
    if (!isSectionVisible(settings, "notes")) data.note = "";
    if (!isSectionVisible(settings, "blocks")) data.blocks = [];
    if (!isSectionVisible(settings, "signatures")) data.signatures = [];
    data.includeSavedSignature =
      data.includeSavedSignature && isSectionVisible(settings, "signatures");
    data.includeStamp =
      data.includeStamp && isSectionVisible(settings, "stamp");
    data.headerLayout = isSectionVisible(settings, "logo")
      ? data.headerLayout
      : "minimal";
  }
  if (document.quotation) {
    const data = document.quotation;
    data.company = blankHidden(
      data.company as unknown as Record<string, unknown>,
      settings,
      "company",
    ) as unknown as typeof data.company;
    data.customer = blankHidden(
      data.customer as unknown as Record<string, unknown>,
      settings,
      "customer",
    ) as unknown as typeof data.customer;
    data.variants = data.variants.map((variant) => ({
      ...variant,
      groups: variant.groups.map((group) => {
        const groupSetting = settings.groups[group.id];
        return {
          ...group,
          visible:
            isSectionVisible(settings, "items") &&
            (groupSetting?.isVisible ?? group.visible),
          items: group.items.map((item) => ({
            ...item,
            visible: settings.items[item.id]?.isVisible ?? item.visible,
            includedInCalculation:
              groupSetting?.includeInCalculation === false
                ? false
                : (settings.items[item.id]?.includeInCalculation ??
                  item.includedInCalculation),
          })),
        };
      }),
    }));
    data.showPrices =
      data.showPrices &&
      isSectionVisible(settings, "financials") &&
      isColumnVisible(settings, "price");
    if (!isSectionVisible(settings, "blocks")) {
      data.introBlocks = [];
      data.conditions = [];
    }
    if (!isSectionVisible(settings, "signatures")) data.signatures = [];
    if (!isSectionVisible(settings, "acceptance"))
      data.showAcceptanceText = false;
    data.includeSavedSignature =
      data.includeSavedSignature && isSectionVisible(settings, "signatures");
    data.includeStamp =
      data.includeStamp && isSectionVisible(settings, "stamp");
    if (!isSectionVisible(settings, "logo")) data.headerLayout = "minimal";
  }
  if (document.purchaseOrder) {
    const data = document.purchaseOrder;
    data.buyer = blankHidden(
      data.buyer as unknown as Record<string, unknown>,
      settings,
      "company",
    ) as unknown as typeof data.buyer;
    data.supplier = blankHidden(
      data.supplier as unknown as Record<string, unknown>,
      settings,
      "supplier",
    ) as unknown as typeof data.supplier;
    data.items = isSectionVisible(settings, "items")
      ? data.items.map((item) => ({
          ...item,
          isVisible: settings.items[item.id]?.isVisible ?? item.isVisible,
          includeInCalculation:
            settings.items[item.id]?.includeInCalculation ??
            item.includeInCalculation,
        }))
      : [];
    data.showPrices =
      data.showPrices &&
      isSectionVisible(settings, "financials") &&
      isColumnVisible(settings, "price");
    if (!isSectionVisible(settings, "delivery")) {
      data.deliveryPlace = "";
      data.deliveryMethod = "";
      data.deliveryTerms = "";
    }
    if (!isSectionVisible(settings, "payment")) {
      data.paymentDeadline = "";
      data.paymentMethod = "";
      data.paymentTerms = "";
    }
    if (!isSectionVisible(settings, "notes")) data.note = "";
    if (!isSectionVisible(settings, "signatures")) {
      data.orderedBy = { name: "", role: "", date: "" };
      data.approvedBy = { name: "", role: "", date: "" };
      data.supplierConfirmation = { name: "", role: "", date: "" };
    }
    data.includeSavedSignature =
      data.includeSavedSignature && isSectionVisible(settings, "signatures");
    data.includeStamp =
      data.includeStamp && isSectionVisible(settings, "stamp");
  }
  if (document.dailyReport) {
    const data = document.dailyReport;
    for (const [id, values] of Object.entries(data.sections))
      data.sections[id as keyof typeof data.sections] = isSectionVisible(settings, id)
        ? values.map((value) => ({ ...value, visible: settings.items[value.id]?.isVisible ?? value.visible, includeInStatistics: settings.items[value.id]?.includeInCalculation ?? value.includeInStatistics }))
        : [];
    data.photos = isSectionVisible(settings, "photos")
      ? data.photos.map((photo) => ({ ...photo, visible: settings.items[photo.id]?.isVisible ?? photo.visible }))
      : [];
    if (!isSectionVisible(settings, "safety")) data.showSafetyDisclaimer = false;
  }
  if (document.completedWorksReport) {
    const data = document.completedWorksReport;
    const basic = data as unknown as Record<string, unknown>;
    for (const key of documentFields)
      if (key in basic && !isFieldVisible(settings, "document", key)) basic[key] = "";
    for (const [id, values] of Object.entries(data.sections))
      data.sections[id as keyof typeof data.sections] = isSectionVisible(settings, id)
        ? values.map((value) => ({ ...value, fields: Object.fromEntries(Object.entries(value.fields).map(([key, field]) => [key, isFieldVisible(settings, id, fieldId(key)) ? field : ""])), visible: settings.items[value.id]?.isVisible ?? value.visible, includeInStatistics: settings.items[value.id]?.includeInCalculation ?? value.includeInStatistics }))
        : [];
    data.phases = isSectionVisible(settings, "phases")
      ? data.phases.map((value) => ({ ...value, visible: settings.items[value.id]?.isVisible ?? value.visible }))
      : [];
    data.photos = isSectionVisible(settings, "photos")
      ? data.photos.map((value) => ({ ...value, visible: settings.items[value.id]?.isVisible ?? value.visible }))
      : [];
    data.showFinancials = data.showFinancials && isSectionVisible(settings, "financials");
  }
  if (document.workHandover) {
    const data = document.workHandover;
    const basic = data as unknown as Record<string, unknown>;
    for (const key of documentFields) if (key in basic && !isFieldVisible(settings, "document", key)) basic[key] = "";
    for (const [id, values] of Object.entries(data.sections))
      data.sections[id as keyof typeof data.sections] = isSectionVisible(settings, id)
        ? values.map(value => ({ ...value, fields: Object.fromEntries(Object.entries(value.fields).map(([key, field]) => [key, isFieldVisible(settings, id, fieldId(key)) ? field : ""])), visible: settings.items[value.id]?.isVisible ?? value.visible, includeInStatistics: settings.items[value.id]?.includeInCalculation ?? value.includeInStatistics }))
        : [];
    data.photos = isSectionVisible(settings, "photos") ? data.photos.map(value => ({ ...value, visible: settings.items[value.id]?.isVisible ?? value.visible })) : [];
    data.showFinancials = data.showFinancials && isSectionVisible(settings, "financials");
  }
  return document;
}

export function applyVisibilityProfile(
  settings: DocumentVisibilitySettings,
  profileId: string,
): DocumentVisibilitySettings {
  const next = structuredClone(settings);
  next.profileId = profileId;
  const sectionValue = (id: string, visible: boolean) => {
    if (next.sections[id]) next.sections[id].isVisible = visible;
  };
  if (profileId === "full") {
    Object.values(next.sections).forEach((value) => (value.isVisible = true));
    next.columns.forEach((value) => (value.isVisible = true));
  }
  if (profileId === "no-prices") {
    sectionValue("financials", false);
    ["price", "discount", "tax", "net", "total"].forEach((id) => {
      const column = next.columns.find((value) => value.id === id);
      if (column) column.isVisible = false;
    });
  }
  if (profileId === "no-customer") sectionValue("customer", false);
  if (profileId === "no-payment") {
    sectionValue("payment", false);
    sectionValue("payments", false);
  }
  if (profileId === "internal") {
    sectionValue("customer", false);
    sectionValue("signatures", false);
    sectionValue("stamp", false);
  }
  if (profileId === "client") {
    sectionValue("customer", true);
    sectionValue("payment", true);
    sectionValue("signatures", true);
  }
  if (profileId === "minimal") {
    Object.keys(next.sections).forEach((id) =>
      sectionValue(
        id,
        ["company", "document", "fields", "items", "financials"].includes(id),
      ),
    );
  }
  return next;
}
