export const projectSections = ["overview", "tasks", "documents", "workforce", "materials", "equipment", "costs", "issues", "photos", "meetings", "reports", "settings"] as const;
export type ProjectSection = (typeof projectSections)[number];
export type ProjectRole = "project_owner" | "project_manager" | "site_manager" | "foreman" | "engineer" | "supervisor" | "accountant" | "procurement" | "subcontractor_manager" | "worker" | "viewer";
export type ProjectStatus = "draft" | "planned" | "preparation" | "active" | "paused" | "waiting_approval" | "completed" | "canceled" | "archived";
export type ProjectHealth = "on_track" | "at_risk" | "delayed" | "critical" | "completed";
export type TaskStatus = "backlog" | "planned" | "ready" | "in_progress" | "blocked" | "waiting_approval" | "completed" | "canceled" | "archived";
export type Priority = "low" | "normal" | "high" | "urgent" | "critical";

export interface ProjectEntity { id: string; organizationId: string; projectId: string; createdAt: string; updatedAt: string; deletedAt?: string | null; archivedAt?: string | null }
export interface Project extends Omit<ProjectEntity, "projectId"> { companyId?: string; code: string; name: string; description: string; projectType: string; status: ProjectStatus; priority: Priority; address: string; city: string; postalCode: string; country: string; startDate: string; expectedEndDate: string; actualEndDate?: string; contractValue: number; budget: number; currency: string; progressPercent: number; healthStatus: ProjectHealth; riskLevel: Priority; projectManagerUserId?: string; siteManagerUserId?: string; coverImagePath?: string }
export interface Phase extends ProjectEntity { parentPhaseId?: string; name: string; code: string; status: string; progressPercent: number; plannedStart: string; plannedEnd: string; budget: number; cost: number; position: number }
export interface Location extends ProjectEntity { parentLocationId?: string; name: string; code: string; kind: string; position: number; active: boolean }
export interface ProjectTask extends ProjectEntity { phaseId?: string; locationId?: string; parentTaskId?: string; title: string; description: string; status: TaskStatus; priority: Priority; taskType: string; startDate: string; dueDate: string; completedAt?: string; progressPercent: number; estimatedHours: number; actualHours: number; assignee: string; checklist: Array<{ id: string; label: string; completed: boolean }> }
export interface WorkforceEntry extends ProjectEntity { name: string; company: string; role: string; crew: string; status: string; regularHours: number; overtimeHours: number; date: string; locationId?: string }
export interface Material extends ProjectEntity { code: string; name: string; category: string; unit: string; planned: number; ordered: number; delivered: number; used: number; damaged: number; returned: number; minimum: number; unitPrice: number; currency: string; status: string; supplier: string }
export interface Equipment extends ProjectEntity { name: string; category: string; inventoryNumber: string; status: string; operator: string; location: string; usageHours: number; nextService?: string; rentalCost: number; currency: string }
export interface ProjectCost extends ProjectEntity { date: string; name: string; category: string; supplier: string; documentNumber: string; subtotal: number; tax: number; total: number; currency: string; status: string; paid: boolean; phaseId?: string }
export interface ProjectIssue extends ProjectEntity { title: string; description: string; category: string; priority: Priority; status: string; owner: string; dueDate: string; costImpact: number; scheduleImpactDays: number; locationId?: string; kind: "issue" | "risk" | "defect" }
export interface Meeting extends ProjectEntity { title: string; type: string; date: string; time: string; location: string; organizer: string; status: string; attendees: string[]; decisions: string[]; actions: string[] }
export interface ProjectPhoto extends ProjectEntity { title: string; description: string; takenAt: string; author: string; category: string; locationId?: string; storagePath?: string; tags: string[] }
export interface ProjectDocumentLink extends ProjectEntity { documentId: string; title: string; documentType: string; status: string; updatedAt: string }
export interface ProjectActivity extends ProjectEntity { type: string; message: string; actor: string }
export interface ProjectSnapshot { project: Project; phases: Phase[]; locations: Location[]; tasks: ProjectTask[]; workforce: WorkforceEntry[]; materials: Material[]; equipment: Equipment[]; costs: ProjectCost[]; issues: ProjectIssue[]; meetings: Meeting[]; photos: ProjectPhoto[]; documents: ProjectDocumentLink[]; activity: ProjectActivity[] }
export type OperationalEntityKey = Exclude<keyof ProjectSnapshot, "project" | "activity">;

export interface ProjectMetrics { openTasks: number; overdueTasks: number; openIssues: number; criticalIssues: number; workersToday: number; hoursToday: number; materialAlerts: number; activeEquipment: number; totalCosts: number; budgetRemaining: number; completionRate: number }
