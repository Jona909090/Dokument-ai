import type { DocumentType } from "@/lib/document-types";
import type {
  DocumentVisibilitySettings,
  VisibilityProfile,
} from "@/lib/document-visibility";
const profilesKey = "dokument-ai-visibility-profiles-v1";
const defaultsKey = "dokument-ai-visibility-defaults-v1";
export function listVisibilityProfiles(): VisibilityProfile[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(profilesKey) ?? "[]",
    ) as VisibilityProfile[];
  } catch {
    return [];
  }
}
export function saveVisibilityProfiles(profiles: VisibilityProfile[]) {
  if (typeof window !== "undefined")
    localStorage.setItem(profilesKey, JSON.stringify(profiles));
}
export function saveDefaultVisibility(
  type: DocumentType,
  settings: DocumentVisibilitySettings,
) {
  if (typeof window === "undefined") return;
  const defaults = readDefaults();
  defaults[type] = settings;
  localStorage.setItem(defaultsKey, JSON.stringify(defaults));
}
export function loadDefaultVisibility(type: DocumentType) {
  return readDefaults()[type];
}
function readDefaults(): Partial<
  Record<DocumentType, DocumentVisibilitySettings>
> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(defaultsKey) ?? "{}") as Partial<
      Record<DocumentType, DocumentVisibilitySettings>
    >;
  } catch {
    return {};
  }
}
