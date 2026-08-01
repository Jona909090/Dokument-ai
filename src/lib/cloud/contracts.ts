import type { PageRequest, PageResult } from "./repository";
export type Entity = { id: string; created_at: string; updated_at?: string; deleted_at?: string | null };
export interface CrudRepository<T extends Entity, I> { list(request: PageRequest): Promise<PageResult<T>>; get(id: string): Promise<T | null>; create(input: I): Promise<T>; update(id: string, input: Partial<I>): Promise<T>; duplicate(id: string): Promise<T>; archive(id: string, archived: boolean): Promise<T>; softDelete(id: string): Promise<void>; restore(id: string): Promise<T> }
export interface ProfileRepository<T, I> { getCurrent(): Promise<T | null>; update(input: I): Promise<T>; removeAvatar(): Promise<void>; exportData(): Promise<Record<string, unknown>> }
export interface OrganizationRepository<T extends Entity, I> extends CrudRepository<T, I> { setCurrent(id: string): Promise<void>; listMemberships(): Promise<Array<{ organization_id: string; role: string; status: string }>> }
export interface CompanyRepository<T extends Entity, I> extends CrudRepository<T, I> { setDefault(id: string): Promise<T> }
export interface ContactRepository<T extends Entity, I> extends CrudRepository<T, I> { merge(sourceIds: string[], targetId: string): Promise<T> }
export interface ProjectRepository<T extends Entity, I> extends CrudRepository<T, I> { addMember(projectId: string, userId: string, role: string): Promise<void> }
export interface TemplateRepository<T extends Entity, I> extends CrudRepository<T, I> { createVersion(templateId: string, definition: unknown): Promise<void>; setDefault(templateId: string, documentType: string): Promise<void> }
export interface AnalyticsRepository<E> { track(event: E): Promise<void>; aggregate(filters: Record<string, unknown>): Promise<Record<string, unknown>> }
