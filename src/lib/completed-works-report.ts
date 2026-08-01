import { localIsoDate } from "@/lib/purchase-order";

export type CompletedWorksTemplate = "classic" | "modern" | "executive";
export type CompletedWorksSectionId =
  | "intro" | "phases" | "works" | "additionalWorks" | "materials"
  | "workforce" | "equipment" | "quality" | "defects" | "problems"
  | "photos" | "attachments" | "deductions" | "conclusion" | "signatures";
export type ReportRecord = {
  id: string; title: string; fields: Record<string, string | number | boolean>;
  visible: boolean; includeInStatistics: boolean;
};
export type WorkPhase = ReportRecord & { collapsed: boolean; showSubtotal: boolean };
export type WorkPhoto = {
  id: string; title: string; description: string; dateTime: string; location: string;
  phase: string; relatedWork: string; state: string; dataUrl: string; visible: boolean;
};
export type CompletedWorksReportData = {
  template: CompletedWorksTemplate; number: string; numberFormat: string; automaticNumber: boolean;
  issueDate: string; periodFrom: string; periodTo: string; projectName: string; siteName: string;
  siteAddress: string; investor: string; customer: string; mainContractor: string;
  subcontractor: string; supervision: string; siteManager: string; foreman: string;
  responsiblePerson: string; contractNumber: string; orderNumber: string; workOrderNumber: string;
  offerNumber: string; projectPhase: string; status: string; showFinancials: boolean;
  photoLayout: "one" | "two" | "four" | "comparison" | "gallery";
  sections: Record<Exclude<CompletedWorksSectionId, "photos" | "phases">, ReportRecord[]>;
  phases: WorkPhase[]; photos: WorkPhoto[];
};

export const completedWorksSectionLabels: Record<CompletedWorksSectionId, string> = {
  intro: "Uvodni tekst", phases: "Faze i grupe radova", works: "Izvedeni radovi",
  additionalWorks: "Dodatni i nepredviđeni radovi", materials: "Korišteni materijal",
  workforce: "Radnici i radni sati", equipment: "Strojevi, alati i oprema",
  quality: "Kontrola kvalitete", defects: "Nedostaci i ispravci",
  problems: "Problemi, zastoji i odstupanja", photos: "Fotografije izvedenih radova",
  attachments: "Prilozi i dokumentacija", deductions: "Odbici i zadržani iznosi",
  conclusion: "Zaključak i preporuke", signatures: "Potpisi i odobrenje",
};

export const completedWorksFields: Record<Exclude<CompletedWorksSectionId, "photos" | "phases">, string[]> = {
  intro: ["tekst", "predložak"],
  works: ["šifra ili pozicija", "naziv rada", "detaljan opis", "faza", "lokacija", "zona", "etaža", "prostorija", "os ili oznaka nacrta", "broj nacrta", "jedinica mjere", "ugovorena količina", "ranije izvedena količina", "izvedeno u razdoblju", "ukupno izvedeno", "preostalo", "završenost %", "odstupanje", "vizualni status", "datum početka", "datum završetka", "broj radnika", "radni sati", "status", "jedinična cijena", "PDV %", "napomena"],
  additionalWorks: ["naziv", "opis", "razlog", "lokacija", "količina", "jedinica", "procijenjena vrijednost", "broj zahtjeva", "datum zahtjeva", "zatražio", "odobrio", "status", "napomena"],
  materials: ["šifra", "naziv materijala", "opis", "proizvođač", "tip ili model", "količina", "jedinica mjere", "broj šarže", "broj certifikata", "dobavljač", "broj dostavnice", "datum isporuke", "lokacija ugradnje", "ugrađena količina", "preostala količina", "status", "napomena"],
  workforce: ["firma ili ekipa", "zanimanje", "broj radnika", "redovni sati", "prekovremeni sati", "ukupni sati", "lokacija rada", "opis zadatka", "razdoblje", "napomena"],
  equipment: ["naziv", "inventarski broj", "vlasnik", "operater", "radni sati", "razdoblje korištenja", "lokacija", "gorivo ili energija", "status", "kvar", "napomena"],
  quality: ["vrsta kontrole", "lokacija", "datum kontrole", "kontrolirao", "rezultat", "dokument ili standard", "izmjerena vrijednost", "dopuštena vrijednost", "nedostatak", "korektivna mjera", "rok ispravke", "status", "fotografije", "prilozi", "napomena"],
  defects: ["redni broj", "naslov", "opis", "lokacija", "datum uočavanja", "uočio", "odgovorna firma", "prioritet", "rok ispravke", "korektivna radnja", "datum ispravke", "pregledao", "status", "fotografija prije", "fotografija poslije", "napomena"],
  problems: ["naslov", "opis", "lokacija", "datum početka", "datum završetka", "izgubljeni sati ili dani", "uzrok", "odgovorna strana", "utjecaj na rok", "utjecaj na trošak", "poduzeta mjera", "status", "fotografije", "prilog", "napomena"],
  attachments: ["naziv", "vrsta", "broj dokumenta", "datum", "opis", "izdavatelj", "povezana faza", "povezani rad"],
  deductions: ["vrsta", "naziv", "iznos", "uključi u izračun", "napomena"],
  conclusion: ["vrsta", "sadržaj"],
  signatures: ["uloga", "ime i prezime", "funkcija", "firma", "datum", "vrijeme", "potpis", "pečat", "napomena", "status odobrenja"],
};

export const createReportRecord = (section: Exclude<CompletedWorksSectionId, "photos" | "phases">, title = completedWorksSectionLabels[section]): ReportRecord => ({
  id: crypto.randomUUID(), title, fields: Object.fromEntries(completedWorksFields[section].map((field) => [field, ""])), visible: true, includeInStatistics: true,
});
export const createWorkPhase = (title = "Pripremni radovi"): WorkPhase => ({ id: crypto.randomUUID(), title, fields: {}, visible: true, includeInStatistics: true, collapsed: false, showSubtotal: true });

export function createCompletedWorksReport(): CompletedWorksReportData {
  const date = localIsoDate(), year = date.slice(0, 4);
  return {
    template: "classic", number: `IR-${year}-001`, numberFormat: "IR-{YYYY}-{NNN}", automaticNumber: true,
    issueDate: date, periodFrom: date, periodTo: date, projectName: "", siteName: "", siteAddress: "",
    investor: "", customer: "", mainContractor: "", subcontractor: "", supervision: "", siteManager: "",
    foreman: "", responsiblePerson: "", contractNumber: "", orderNumber: "", workOrderNumber: "", offerNumber: "",
    projectPhase: "", status: "nacrt", showFinancials: false, photoLayout: "two",
    phases: [createWorkPhase()], photos: [],
    sections: {
      intro: [createReportRecord("intro", "Uvod")], works: [], additionalWorks: [], materials: [], workforce: [],
      equipment: [], quality: [], defects: [], problems: [], attachments: [], deductions: [], conclusion: [], signatures: [],
    },
  };
}
const n = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
export function recalculateWork(record: ReportRecord): ReportRecord {
  const fields = { ...record.fields }, contracted = n(fields["ugovorena količina"]), earlier = n(fields["ranije izvedena količina"]), current = n(fields["izvedeno u razdoblju"]), total = earlier + current;
  fields["ukupno izvedeno"] = total; fields.preostalo = contracted - total;
  fields["završenost %"] = contracted ? Math.round((total / contracted) * 10000) / 100 : 0;
  fields["vizualni status"] = total > contracted ? "prekoračena količina" : total >= contracted && contracted > 0 ? "završeno" : String(fields.status).includes("zaustavljeno") ? "kašnjenje" : "prema planu";
  return { ...record, fields };
}
export function calculateCompletedWorksSummary(data: CompletedWorksReportData) {
  const works = data.sections.works.filter((v) => v.visible && v.includeInStatistics).map(recalculateWork);
  const workforce = data.sections.workforce.filter((v) => v.visible && v.includeInStatistics);
  const additions = data.sections.additionalWorks.filter((v) => v.visible && v.includeInStatistics);
  const deductions = data.sections.deductions.filter((v) => v.visible && v.includeInStatistics && v.fields["uključi u izračun"] !== false);
  const net = works.reduce((s, v) => s + n(v.fields["izvedeno u razdoblju"]) * n(v.fields["jedinična cijena"]), 0) + additions.reduce((s,v)=>s+n(v.fields["procijenjena vrijednost"]),0) - deductions.reduce((s,v)=>s+n(v.fields.iznos),0);
  const tax = works.reduce((s,v)=>s+n(v.fields["izvedeno u razdoblju"])*n(v.fields["jedinična cijena"])*n(v.fields["PDV %"])/100,0);
  return { phases: data.phases.filter(v=>v.visible).length, works: works.length, completed: works.filter(v=>n(v.fields["završenost %"])>=100).length, inProgress: works.filter(v=>n(v.fields["završenost %"])>0&&n(v.fields["završenost %"])<100).length, quantity: works.reduce((s,v)=>s+n(v.fields["izvedeno u razdoblju"]),0), averageCompletion: works.length ? works.reduce((s,v)=>s+n(v.fields["završenost %"]),0)/works.length : 0, workers: workforce.reduce((s,v)=>s+n(v.fields["broj radnika"]),0), workHours: workforce.reduce((s,v)=>s+n(v.fields["ukupni sati"]) || s+(n(v.fields["redovni sati"])+n(v.fields["prekovremeni sati"]))*Math.max(1,n(v.fields["broj radnika"])),0), openDefects: data.sections.defects.filter(v=>v.visible&&!['zatvoreno','ispravljeno'].includes(String(v.fields.status))).length, closedDefects: data.sections.defects.filter(v=>v.visible&&['zatvoreno','ispravljeno'].includes(String(v.fields.status))).length, additionalWorks: additions.length, net, tax, total: net + tax };
}
