import type { ProjectRole, ProjectSection } from "./types";

export type ProjectAction = "read" | "create" | "update" | "delete" | "restore" | "approve" | "manage_members" | "view_financials";
const all: ProjectAction[] = ["read", "create", "update", "delete", "restore", "approve", "manage_members", "view_financials"];
const grants: Record<ProjectRole, ProjectAction[]> = {
  project_owner: all, project_manager: all, site_manager: ["read", "create", "update", "delete", "restore", "approve", "manage_members"],
  foreman: ["read", "create", "update"], engineer: ["read", "create", "update"], supervisor: ["read", "create", "update", "approve"],
  accountant: ["read", "create", "update", "approve", "view_financials"], procurement: ["read", "create", "update", "approve", "view_financials"],
  subcontractor_manager: ["read", "create", "update"], worker: ["read", "update"], viewer: ["read"],
};
const financialSections = new Set<ProjectSection>(["costs"]);
export function canAccessProject(role: ProjectRole, section: ProjectSection, action: ProjectAction) { return grants[role].includes(action) && (!financialSections.has(section) || grants[role].includes("view_financials")); }
export function requireProjectPermission(role: ProjectRole, section: ProjectSection, action: ProjectAction) { if (!canAccessProject(role, section, action)) throw new Error("Nemate projektnu dozvolu za ovu radnju."); }
