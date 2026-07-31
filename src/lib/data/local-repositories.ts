import {
  demoCompany,
  demoContacts,
  demoDocuments,
  demoUser,
} from "./demo-data";
import type { Company, Contact, SavedDocument, User } from "./models";
import type {
  CompanyRepository,
  ContactRepository,
  DocumentRepository,
  RepositoryBundle,
  UserRepository,
} from "./repositories";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const keys = {
  user: "dokument-ai-data-user",
  company: "dokument-ai-data-company",
  contacts: "dokument-ai-data-contacts",
  documents: "dokument-ai-data-documents",
  seeded: "dokument-ai-data-seeded",
};
const read = <T>(storage: StorageLike, key: string, fallback: T): T => {
  try {
    return JSON.parse(storage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
};
const write = <T>(storage: StorageLike, key: string, value: T) =>
  storage.setItem(key, JSON.stringify(value));
const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function createLocalRepositories(
  storage: StorageLike,
  seed = true,
): RepositoryBundle {
  if (seed && !storage.getItem(keys.seeded)) {
    write(storage, keys.user, demoUser);
    write(storage, keys.company, demoCompany);
    write(storage, keys.contacts, demoContacts);
    write(storage, keys.documents, demoDocuments);
    storage.setItem(keys.seeded, "true");
  }
  const users: UserRepository = {
    getCurrent: () => read<User | null>(storage, keys.user, null),
    save: (user) => {
      write(storage, keys.user, user);
      return user;
    },
    clear: () => storage.removeItem(keys.user),
  };
  const companies: CompanyRepository = {
    getByUser: (userId) => {
      const value = read<Company | null>(storage, keys.company, null);
      return value?.userId === userId ? value : null;
    },
    save: (company) => {
      const saved = { ...company, updatedAt: new Date().toISOString() };
      write(storage, keys.company, saved);
      return saved;
    },
    clear: () => storage.removeItem(keys.company),
  };
  const contacts: ContactRepository = {
    list: (userId) =>
      read<Contact[]>(storage, keys.contacts, []).filter(
        (item) => item.userId === userId,
      ),
    get: (contactId) =>
      read<Contact[]>(storage, keys.contacts, []).find(
        (item) => item.id === contactId,
      ) ?? null,
    save: (contact) => {
      const all = read<Contact[]>(storage, keys.contacts, []);
      const saved = {
        ...contact,
        id: contact.id || id(),
        updatedAt: new Date().toISOString(),
      };
      write(storage, keys.contacts, [
        ...all.filter((item) => item.id !== saved.id),
        saved,
      ]);
      return saved;
    },
    delete: (contactId) =>
      write(
        storage,
        keys.contacts,
        read<Contact[]>(storage, keys.contacts, []).filter(
          (item) => item.id !== contactId,
        ),
      ),
    clear: () => storage.removeItem(keys.contacts),
  };
  const documents: DocumentRepository = {
    list: (userId) =>
      read<SavedDocument[]>(storage, keys.documents, []).filter(
        (item) => item.userId === userId,
      ),
    get: (documentId) =>
      read<SavedDocument[]>(storage, keys.documents, []).find(
        (item) => item.id === documentId,
      ) ?? null,
    save: (document) => {
      const all = read<SavedDocument[]>(storage, keys.documents, []);
      const timestamp = new Date().toISOString();
      const saved = {
        ...document,
        id: document.id || id(),
        updatedAt: timestamp,
        lastOpenedAt: document.lastOpenedAt || timestamp,
      };
      write(storage, keys.documents, [
        ...all.filter((item) => item.id !== saved.id),
        saved,
      ]);
      return saved;
    },
    duplicate: (documentId) => {
      const source = documents.get(documentId);
      if (!source) return null;
      const timestamp = new Date().toISOString();
      const copy = {
        ...source,
        id: id(),
        title: `${source.title} — kopija`,
        documentNumber: `${source.documentNumber}-COPY`,
        status: "draft" as const,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastOpenedAt: timestamp,
      };
      return documents.save(copy);
    },
    archive: (documentId) => {
      const source = documents.get(documentId);
      return source ? documents.save({ ...source, status: "archived" }) : null;
    },
    delete: (documentId) =>
      write(
        storage,
        keys.documents,
        read<SavedDocument[]>(storage, keys.documents, []).filter(
          (item) => item.id !== documentId,
        ),
      ),
    clear: () => storage.removeItem(keys.documents),
  };
  return {
    users,
    companies,
    contacts,
    documents,
    clearDemoData() {
      storage.removeItem(keys.user);
      storage.removeItem(keys.company);
      storage.removeItem(keys.contacts);
      storage.removeItem(keys.documents);
      storage.setItem(keys.seeded, "cleared");
    },
  };
}

export class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
