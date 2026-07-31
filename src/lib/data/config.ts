import { createLocalRepositories } from "./local-repositories";
import type { RepositoryBundle } from "./repositories";

export type DataAdapterName = "local" | "supabase";
export const activeDataAdapter: DataAdapterName = "local";
let repositories: RepositoryBundle | null = null;

export function getRepositories(): RepositoryBundle {
  if (typeof window === "undefined") throw new Error("Lokalni repository dostupan je samo u pregledniku.");
  if (!repositories) repositories = createLocalRepositories(window.localStorage);
  return repositories;
}

// Future Supabase integration point: return a Supabase RepositoryBundle here
// without changing any UI component.
export function resetRepositoryInstance() { repositories = null; }
