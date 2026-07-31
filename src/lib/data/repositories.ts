import type { Company, Contact, SavedDocument, User } from "./models";

export interface UserRepository { getCurrent(): User | null; save(user: User): User; clear(): void }
export interface CompanyRepository { getByUser(userId: string): Company | null; save(company: Company): Company; clear(): void }
export interface ContactRepository { list(userId: string): Contact[]; get(id: string): Contact | null; save(contact: Contact): Contact; delete(id: string): void; clear(): void }
export interface DocumentRepository { list(userId: string): SavedDocument[]; get(id: string): SavedDocument | null; save(document: SavedDocument): SavedDocument; duplicate(id: string): SavedDocument | null; archive(id: string): SavedDocument | null; delete(id: string): void; clear(): void }

export type RepositoryBundle = { users: UserRepository; companies: CompanyRepository; contacts: ContactRepository; documents: DocumentRepository; clearDemoData(): void };
