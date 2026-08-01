import { BarChart3, BriefcaseBusiness, CalendarDays, ClipboardCheck, FileText, FolderKanban, HardHat, Images, Package, Settings, TriangleAlert, Truck } from "lucide-react";
import type { ProjectSection } from "./types";
export const projectNavigation: Array<{ key: ProjectSection; label: string; icon: typeof FolderKanban }> = [
  { key: "overview", label: "Pregled", icon: BarChart3 }, { key: "tasks", label: "Zadaci", icon: ClipboardCheck }, { key: "documents", label: "Dokumenti", icon: FileText }, { key: "workforce", label: "Radnici i sati", icon: HardHat }, { key: "materials", label: "Materijali", icon: Package }, { key: "equipment", label: "Oprema", icon: Truck }, { key: "costs", label: "Troškovi i budžet", icon: BriefcaseBusiness }, { key: "issues", label: "Problemi i rizici", icon: TriangleAlert }, { key: "photos", label: "Fotografije", icon: Images }, { key: "meetings", label: "Sastanci", icon: CalendarDays }, { key: "reports", label: "Izvještaji", icon: FileText }, { key: "settings", label: "Postavke", icon: Settings },
];
export const isProjectSection = (value: string): value is ProjectSection => projectNavigation.some((item) => item.key === value);
