import type { AdminPermission } from "./permissions";
export const adminModules = {
  users: { title: "Korisnici", description: "Profili, statusi i sigurni usage metapodaci.", permission: "users:read", empty: "Nema korisnika za prikaz." },
  organizations: { title: "Organizacije", description: "Članovi, paketi i agregirana potrošnja.", permission: "organizations:read", empty: "Nema organizacija." },
  subscriptions: { title: "Pretplate", description: "Stripe projekcija, trial, failed payments i manual grants.", permission: "billing:read", empty: "Nema pretplata." },
  plans: { title: "Planovi", description: "Verzije paketa, cijene, značajke i limiti.", permission: "billing:read", empty: "Nema objavljenih promjena planova." },
  documents: { title: "Dokumenti", description: "Isključivo sigurni metapodaci bez sadržaja dokumenta.", permission: "analytics:read", empty: "Nema agregiranih metapodataka." },
  "document-types": { title: "Vrste dokumenata", description: "Schema, jezici, izvozi i lifecycle bez trajnog brisanja.", permission: "content:read", empty: "Nema registriranih vrsta." },
  templates: { title: "Predlošci", description: "Sistemski predlošci, verzije, objava i rollback.", permission: "content:read", empty: "Nema sistemskih predložaka." },
  ai: { title: "AI centar", description: "Agregirani zahtjevi, modeli, greške i provider status — bez promptova.", permission: "ai:read", empty: "Nema AI usage podataka." },
  analytics: { title: "Analytics", description: "DAU, WAU, MAU, aktivacija, retention i agregirana upotreba.", permission: "analytics:read", empty: "Nema dovoljno agregiranih događaja." },
  support: { title: "Podrška", description: "Tiketi, SLA, dodjela, sigurne poruke i vremenski ograničen pristup.", permission: "support:read", empty: "Nema otvorenih tiketa." },
  bugs: { title: "Prijavljene greške", description: "Triage, ozbiljnost, duplikati i release poveznice.", permission: "support:read", empty: "Nema prijavljenih grešaka." },
  feedback: { title: "Feedback", description: "Feature requests, glasovi i javni roadmap status.", permission: "content:read", empty: "Nema prijedloga." },
  notifications: { title: "Obavijesti", description: "Ciljane in-app kampanje, preview i zakazivanje.", permission: "content:read", empty: "Nema kampanja." },
  content: { title: "CMS", description: "Javni sadržaj s draft, preview, publish i rollback tokom.", permission: "content:read", empty: "Nema CMS stranica." },
  emails: { title: "Email predlošci", description: "Lokalizirane verzije i demo test-send bez providera.", permission: "content:read", empty: "Nema email predložaka." },
  security: { title: "Security centar", description: "Sigurni događaji, sesije, rate limit i webhook incidenti.", permission: "security:read", empty: "Nema otvorenih sigurnosnih događaja." },
  audit: { title: "Audit log", description: "Neizmjenjiva povijest privilegiranih radnji.", permission: "audit:read", empty: "Nema audit događaja." },
  system: { title: "Sistemski status", description: "App, baza, auth, storage, AI, Stripe i izvozi.", permission: "security:read", empty: "Nema prijavljenih incidenata." },
  settings: { title: "Admin postavke", description: "Tema, gustoća, jezik, vremenska zona i spremljeni pogledi.", permission: "audit:read", empty: "Nema spremljenih postavki." },
} as const satisfies Record<string, { title: string; description: string; permission: AdminPermission; empty: string }>;
export type AdminModuleKey = keyof typeof adminModules;
export const isAdminModule = (value: string): value is AdminModuleKey => value in adminModules;

