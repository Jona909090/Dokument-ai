import { localIsoDate } from "@/lib/purchase-order";
export type DailyReportTemplate = "classic" | "modern" | "executive";
export type DailySectionId =
  | "weather"
  | "workforce"
  | "completedWorks"
  | "plannedWorks"
  | "materials"
  | "equipment"
  | "deliveries"
  | "problems"
  | "quality"
  | "safety"
  | "visitors"
  | "meetings"
  | "photos"
  | "attachments"
  | "notes"
  | "signatures"
  | "custom";
export type DailyRecord = {
  id: string;
  title: string;
  fields: Record<string, string | number | boolean>;
  visible: boolean;
  includeInStatistics: boolean;
};
export type DailyPhoto = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  category: string;
  relatedWork: string;
  relatedProblem: string;
  dataUrl: string;
  visible: boolean;
};
export type DailyReportData = {
  template: DailyReportTemplate;
  number: string;
  numberFormat: string;
  automaticNumber: boolean;
  date: string;
  day: string;
  projectName: string;
  siteName: string;
  siteAddress: string;
  investor: string;
  mainContractor: string;
  subcontractor: string;
  supervision: string;
  siteManager: string;
  foreman: string;
  responsiblePerson: string;
  contractNumber: string;
  workOrderNumber: string;
  projectPhase: string;
  status: string;
  photoLayout: "one" | "two" | "four" | "gallery";
  sections: Record<DailySectionId, DailyRecord[]>;
  photos: DailyPhoto[];
  safetyDisclaimer: string;
  showSafetyDisclaimer: boolean;
};
export const dailySectionLabels: Record<DailySectionId, string> = {
  weather: "Vremenski uvjeti",
  workforce: "Radnici i ekipe",
  completedWorks: "Izvedeni radovi",
  plannedWorks: "Planirani i neizvedeni radovi",
  materials: "Materijal",
  equipment: "Alati, strojevi i mehanizacija",
  deliveries: "Dostave i otpreme",
  problems: "Problemi, zastoji i rizici",
  quality: "Kvaliteta i kontrole",
  safety: "Sigurnost na radu",
  visitors: "Posjetitelji",
  meetings: "Sastanci",
  photos: "Fotografije",
  attachments: "Prilozi",
  notes: "Napomene i upute",
  signatures: "Potpisi",
  custom: "Prilagođene sekcije",
};
export const dailyFieldTemplates: Record<DailySectionId, string[]> = {
  weather: [
    "vrijeme",
    "jutarnja temperatura",
    "dnevna temperatura",
    "uvjeti",
    "padaline",
    "vjetar",
    "stanje terena",
    "utjecaj na radove",
    "početak rada",
    "završetak rada",
  ],
  workforce: [
    "ime ili ekipa",
    "firma",
    "zanimanje",
    "broj radnika",
    "dolazak",
    "odlazak",
    "radni sati",
    "prekovremeni sati",
    "lokacija",
    "zadatak",
    "napomena",
    "prisutan",
  ],
  completedWorks: [
    "kategorija",
    "naziv radova",
    "opis",
    "lokacija",
    "zona",
    "etaža",
    "nacrt ili pozicija",
    "količina",
    "jedinica",
    "završenost %",
    "broj radnika",
    "početak",
    "završetak",
    "status",
    "napomena",
  ],
  plannedWorks: [
    "vrsta",
    "naziv",
    "opis",
    "razlog neizvođenja",
    "plan za sljedeći dan",
    "status",
    "napomena",
  ],
  materials: [
    "šifra",
    "naziv materijala",
    "opis",
    "količina",
    "jedinica",
    "dobavljač",
    "broj dostavnice",
    "vrijeme dolaska",
    "skladištenje",
    "utrošeno",
    "preostalo",
    "stanje",
    "napomena",
  ],
  equipment: [
    "naziv",
    "inventarski broj",
    "vlasnik ili firma",
    "operater",
    "početak",
    "završetak",
    "radni sati",
    "gorivo ili energija",
    "lokacija",
    "status",
    "kvar",
    "napomena",
  ],
  deliveries: [
    "vrsta",
    "dobavljač ili primatelj",
    "registracija vozila",
    "vozač",
    "dolazak",
    "odlazak",
    "broj dostavnice",
    "sadržaj",
    "količina",
    "napomena",
    "primio",
  ],
  problems: [
    "naslov",
    "kategorija",
    "opis",
    "vrijeme nastanka",
    "lokacija",
    "odgovorna osoba",
    "utjecaj na rok",
    "utjecaj na trošak",
    "prioritet",
    "privremena mjera",
    "trajno rješenje",
    "rok rješavanja",
    "status",
    "napomena",
  ],
  quality: [
    "izvršena kontrola",
    "vrsta kontrole",
    "lokacija",
    "kontrolirao",
    "rezultat",
    "nedostatak",
    "korektivna mjera",
    "rok ispravka",
    "status",
    "napomena",
  ],
  safety: [
    "toolbox sastanak",
    "tema",
    "broj prisutnih",
    "voditelj",
    "uočeni rizici",
    "zaštitna oprema",
    "incident",
    "gotovo nezgoda",
    "ozljeda",
    "poduzeta mjera",
    "obustava rada",
    "napomena",
  ],
  visitors: [
    "ime i prezime",
    "firma",
    "funkcija",
    "dolazak",
    "odlazak",
    "razlog posjete",
    "domaćin",
    "napomena",
  ],
  meetings: [
    "naziv",
    "vrijeme",
    "sudionici",
    "teme",
    "zaključci",
    "zadaci",
    "odgovorne osobe",
    "rokovi",
  ],
  photos: [],
  attachments: ["naziv", "vrsta", "opis", "datum", "povezana sekcija"],
  notes: ["vrsta", "sadržaj", "interna napomena"],
  signatures: [
    "uloga",
    "ime i prezime",
    "funkcija",
    "firma",
    "datum",
    "vrijeme",
    "napomena",
    "potpis",
    "pečat",
  ],
  custom: ["naslov", "vrsta", "sadržaj"],
};
export const createDailyRecord = (
  section: DailySectionId,
  title = dailySectionLabels[section],
): DailyRecord => ({
  id: crypto.randomUUID(),
  title,
  fields: Object.fromEntries(
    dailyFieldTemplates[section].map((field) => [field, ""]),
  ),
  visible: true,
  includeInStatistics: true,
});
export function createDailyReport(): DailyReportData {
  const date = localIsoDate();
  return {
    template: "classic",
    number: `DI-${date.slice(0, 4)}-001`,
    numberFormat: "DI-{YYYY}-{NNN}",
    automaticNumber: true,
    date,
    day: new Intl.DateTimeFormat("hr-HR", { weekday: "long" }).format(
      new Date(`${date}T12:00:00`),
    ),
    projectName: "",
    siteName: "",
    siteAddress: "",
    investor: "",
    mainContractor: "",
    subcontractor: "",
    supervision: "",
    siteManager: "",
    foreman: "",
    responsiblePerson: "",
    contractNumber: "",
    workOrderNumber: "",
    projectPhase: "",
    status: "radovi izvedeni",
    photoLayout: "two",
    sections: {
      weather: [createDailyRecord("weather", "Jutarnji zapis")],
      workforce: [],
      completedWorks: [],
      plannedWorks: [],
      materials: [],
      equipment: [],
      deliveries: [],
      problems: [],
      quality: [],
      safety: [],
      visitors: [],
      meetings: [],
      photos: [],
      attachments: [],
      notes: [],
      signatures: [],
      custom: [],
    },
    photos: [],
    safetyDisclaimer:
      "Ova evidencija ne zamjenjuje službene zakonske evidencije zaštite na radu.",
    showSafetyDisclaimer: true,
  };
}
const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
export function calculateDailyStats(data: DailyReportData) {
  const workers = data.sections.workforce.filter(
    (v) => v.visible && v.includeInStatistics,
  );
  const works = data.sections.completedWorks.filter(
    (v) => v.visible && v.includeInStatistics,
  );
  const materials = data.sections.materials.filter(
    (v) => v.visible && v.includeInStatistics,
  );
  const equipment = data.sections.equipment.filter(
    (v) => v.visible && v.includeInStatistics,
  );
  return {
    workers: workers.reduce(
      (sum, v) => sum + number(v.fields["broj radnika"]),
      0,
    ),
    workHours: workers.reduce(
      (sum, v) =>
        sum +
        number(v.fields["radni sati"]) *
          Math.max(1, number(v.fields["broj radnika"])),
      0,
    ),
    overtimeHours: workers.reduce(
      (sum, v) => sum + number(v.fields["prekovremeni sati"]),
      0,
    ),
    completedWorks: works.length,
    openProblems: data.sections.problems.filter(
      (v) => v.visible && v.fields.status !== "riješeno",
    ).length,
    materialUsed: materials.reduce(
      (sum, v) => sum + number(v.fields.utrošeno),
      0,
    ),
    equipmentHours: equipment.reduce(
      (sum, v) => sum + number(v.fields["radni sati"]),
      0,
    ),
  };
}
export function copyPreviousDailyReport(
  previous: DailyReportData,
  selected: DailySectionId[],
) {
  const next = createDailyReport();
  for (const section of selected)
    next.sections[section] = structuredClone(previous.sections[section]).map(
      (v) => ({ ...v, id: crypto.randomUUID() }),
    );
  next.projectName = previous.projectName;
  next.siteName = previous.siteName;
  next.siteAddress = previous.siteAddress;
  next.investor = previous.investor;
  next.mainContractor = previous.mainContractor;
  return next;
}
