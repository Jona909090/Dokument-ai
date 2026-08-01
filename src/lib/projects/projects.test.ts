import { describe, expect, it } from "vitest";
import { LocalProjectRepository } from "./local-repository";
import { canAccessProject } from "./permissions";
import { calculateProjectMetrics, ProjectService } from "./service";
import type { ProjectStorage, } from "./local-repository";

class MemoryStorage implements ProjectStorage { private data = new Map<string,string>(); getItem(key: string) { return this.data.get(key) ?? null; } setItem(key: string, value: string) { this.data.set(key, value); } }
describe("project operations", () => {
  it("seeds, searches, duplicates and archives projects through the service", async () => { const service = new ProjectService(new LocalProjectRepository(new MemoryStorage())); const initial = await service.list({ search: "hidro" }); expect(initial.total).toBe(1); const copy = await service.duplicateProject(initial.items[0].id); expect(copy.status).toBe("draft"); expect((await service.list()).total).toBe(2); await service.archiveProject(copy.id, true); expect((await service.list()).total).toBe(1); });
  it("saves a task status change without mutating another collection", async () => { const repository = new LocalProjectRepository(new MemoryStorage()); const service = new ProjectService(repository); const before = await service.get("proj-hidro-centar", "tasks"); expect(before).not.toBeNull(); const task = before!.tasks[0]; await service.saveEntity(before!.project.id, "tasks", "tasks", { ...task, status: "completed" }); const after = await service.get(before!.project.id, "tasks"); expect(after!.tasks[0].status).toBe("completed"); expect(after!.materials).toHaveLength(before!.materials.length); });
  it("calculates operational metrics from records, not presentation constants", async () => { const snapshot = await new LocalProjectRepository(new MemoryStorage()).get("proj-hidro-centar"); const metrics = calculateProjectMetrics(snapshot!, new Date("2026-08-01T12:00:00Z")); expect(metrics.openTasks).toBe(3); expect(metrics.overdueTasks).toBe(0); expect(metrics.workersToday).toBe(2); expect(metrics.hoursToday).toBe(17); expect(metrics.totalCosts).toBe(24000); });
  it("enforces project role and financial section permissions", () => { expect(canAccessProject("viewer", "tasks", "read")).toBe(true); expect(canAccessProject("viewer", "tasks", "update")).toBe(false); expect(canAccessProject("foreman", "costs", "read")).toBe(false); expect(canAccessProject("accountant", "costs", "read")).toBe(true); expect(canAccessProject("project_manager", "settings", "manage_members")).toBe(true); });
});
