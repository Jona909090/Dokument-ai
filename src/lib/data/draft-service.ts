import type { DocumentType } from "@/lib/document-types";
import type { GeneratedDocument } from "@/lib/generated-document";

const DRAFT_PREFIX = "dokument-ai-draft-";
const RECENT_KEY = "dokument-ai-recent";

export function saveEditorDraft(document: GeneratedDocument) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${DRAFT_PREFIX}${document.type}`,
    JSON.stringify(document),
  );
  const recent = readRecentDocumentTypes();
  window.localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(
      [document.type, ...recent.filter((item) => item !== document.type)].slice(
        0,
        5,
      ),
    ),
  );
}

export function readRecentDocumentTypes(): DocumentType[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      window.localStorage.getItem(RECENT_KEY) ?? "[]",
    ) as DocumentType[];
  } catch {
    return [];
  }
}
