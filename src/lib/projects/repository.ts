import type { OperationalEntityKey, Project, ProjectSnapshot } from "./types";
export interface ProjectQuery { search?: string; status?: string; includeArchived?: boolean; page?: number; pageSize?: number }
export interface ProjectPage { items: Project[]; total: number; page: number; pageSize: number }
export interface ProjectRepository {
  list(query?: ProjectQuery): Promise<ProjectPage>;
  get(id: string): Promise<ProjectSnapshot | null>;
  saveProject(project: Project): Promise<Project>;
  duplicateProject(id: string): Promise<Project>;
  archiveProject(id: string, archived: boolean): Promise<Project>;
  softDeleteProject(id: string): Promise<void>;
  restoreProject(id: string): Promise<Project>;
  saveEntity<K extends OperationalEntityKey>(projectId: string, key: K, entity: ProjectSnapshot[K][number]): Promise<ProjectSnapshot[K][number]>;
  softDeleteEntity<K extends OperationalEntityKey>(projectId: string, key: K, id: string): Promise<void>;
}
