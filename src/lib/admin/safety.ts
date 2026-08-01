const allowedExportFields = new Set(["id","email","full_name","status","country","language","plan","created_at","last_sign_in_at","organization_name","ticket_number","subject","category","priority","safe_metadata"]);
export function sanitizeCMS(input: string) { return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "").replace(/javascript:/gi, "").trim(); }
export function safeAdminExport<T extends Record<string, unknown>>(rows: T[]) { return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => allowedExportFields.has(key)))); }
export function canAccessSharedDocument(grant: { expiresAt: string; revokedAt: string | null; allowDownload: boolean }, download = false) { return !grant.revokedAt && new Date(grant.expiresAt) > new Date() && (!download || grant.allowDownload); }
export function adminPageRange(page: number, pageSize = 25) { const safePage = Math.max(1, Math.floor(page)); const safeSize = Math.min(100, Math.max(10, Math.floor(pageSize))); return { from: (safePage - 1) * safeSize, to: safePage * safeSize - 1, page: safePage, pageSize: safeSize }; }

