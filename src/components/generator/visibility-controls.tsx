"use client";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GeneratedDocument } from "@/lib/generated-document";
import {
  applyVisibilityProfile,
  createDefaultVisibility,
  normalizeDocumentVisibility,
  sectionLabels,
  type DocumentVisibilitySettings,
  type VisibilityProfile,
} from "@/lib/document-visibility";
import {
  listVisibilityProfiles,
  saveDefaultVisibility,
  saveVisibilityProfiles,
} from "@/lib/visibility-profile-store";

const builtIns = [
  ["full", "Potpuni dokument"],
  ["no-prices", "Dokument bez cijena"],
  ["no-customer", "Dokument bez kupca"],
  ["no-payment", "Bez podataka za plaćanje"],
  ["internal", "Interna verzija"],
  ["client", "Verzija za klijenta"],
  ["minimal", "Minimalistička verzija"],
  ["custom", "Prilagođeno"],
];
export function VisibilityToggle({
  visible,
  onChange,
  label,
}: {
  visible: boolean;
  onChange: (visible: boolean) => void;
  label: string;
}) {
  const action = visible ? "Sakrij iz dokumenta" : "Prikaži u dokumentu";
  return (
    <button
      type="button"
      title={action}
      aria-label={`${action}: ${label}`}
      aria-pressed={visible}
      onClick={() => onChange(!visible)}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition ${visible ? "bg-background text-foreground" : "border-dashed bg-muted text-muted-foreground opacity-70"}`}
    >
      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      <span className="sm:hidden">{visible ? "Prikazano" : "Skriveno"}</span>
    </button>
  );
}
export function SectionVisibilityControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: DocumentVisibilitySettings["sections"][string];
  onChange: (value: DocumentVisibilitySettings["sections"][string]) => void;
}) {
  const fields = Object.entries(value.fields);
  return (
    <details
      className={`rounded-xl border ${value.isVisible ? "bg-card" : "bg-muted/50 opacity-75"}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
        <VisibilityToggle
          visible={value.isVisible}
          onChange={(isVisible) => onChange({ ...value, isVisible })}
          label={sectionLabels[id] ?? id}
        />
        <span className="flex-1 text-sm font-semibold">
          {sectionLabels[id] ?? id}
        </span>
        <span className="text-xs text-muted-foreground">
          {value.isVisible ? "Prikazano" : "Skriveno"}
        </span>
        <ChevronDown className="size-4" />
      </summary>
      {fields.length > 0 && (
        <div className="border-t p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                onChange({
                  ...value,
                  fields: Object.fromEntries(
                    fields.map(([key]) => [key, { isVisible: true }]),
                  ),
                })
              }
            >
              Prikaži sva polja
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                onChange({
                  ...value,
                  fields: Object.fromEntries(
                    fields.map(([key]) => [key, { isVisible: false }]),
                  ),
                })
              }
            >
              Sakrij sva polja
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map(([fieldId, field]) => (
              <div
                key={fieldId}
                className={`flex items-center gap-2 rounded-lg border p-2 ${field.isVisible ? "" : "bg-muted opacity-70"}`}
              >
                <span className="min-w-0 flex-1 truncate text-xs">
                  {fieldId.replaceAll("-", " ")}
                </span>
                <VisibilityToggle
                  visible={field.isVisible}
                  onChange={(isVisible) =>
                    onChange({
                      ...value,
                      fields: { ...value.fields, [fieldId]: { isVisible } },
                    })
                  }
                  label={fieldId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
export function ColumnVisibilityManager({
  settings,
  onChange,
}: {
  settings: DocumentVisibilitySettings;
  onChange: (settings: DocumentVisibilitySettings) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const columns = [...settings.columns];
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    [columns[index], columns[target]] = [columns[target], columns[index]];
    onChange({
      ...settings,
      columns: columns.map((column, order) => ({ ...column, order })),
    });
  };
  return (
    <details className="rounded-xl border">
      <summary className="cursor-pointer list-none p-3 text-sm font-semibold">
        Postavke kolona
      </summary>
      <div className="space-y-2 border-t p-3">
        {settings.columns.map((column, index) => (
          <div
            key={column.id}
            className={`flex items-center gap-2 rounded-lg border p-2 ${column.isVisible ? "" : "bg-muted opacity-70"}`}
          >
            <GripVertical className="size-4 text-muted-foreground" />
            <span className="flex-1 text-xs">{column.label}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => move(index, -1)}
              aria-label={`Pomakni ${column.label} gore`}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => move(index, 1)}
              aria-label={`Pomakni ${column.label} dolje`}
            >
              ↓
            </Button>
            <VisibilityToggle
              visible={column.isVisible}
              onChange={(isVisible) =>
                onChange({
                  ...settings,
                  profileId: "custom",
                  columns: settings.columns.map((v) =>
                    v.id === column.id ? { ...v, isVisible } : v,
                  ),
                })
              }
              label={`kolona ${column.label}`}
            />
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...settings,
              columns: createDefaultVisibility().columns,
            })
          }
        >
          <RotateCcw className="size-4" />
          Vrati zadani raspored
        </Button>
      </div>
    </details>
  );
}

export function DocumentVisibilityPanel({
  document,
  onChange,
}: {
  document: GeneratedDocument;
  onChange: (settings: DocumentVisibilitySettings) => void;
}) {
  const settings = useMemo(
    () => normalizeDocumentVisibility(document),
    [document],
  );
  const [profiles, setProfiles] = useState<VisibilityProfile[]>(
    listVisibilityProfiles,
  );
  const [profileName, setProfileName] = useState("");
  const dailyReport = document.dailyReport;
  const completedWorksReport = document.completedWorksReport;
  const workHandover = document.workHandover;
  const fallbackEntries = workHandover
    ? [...Object.values(workHandover.sections).flat().map((value) => [value.id, value.title] as const), ...workHandover.photos.map((value) => [value.id, value.title] as const)]
    : completedWorksReport
    ? [...Object.values(completedWorksReport.sections).flat().map((value) => [value.id, value.title] as const), ...completedWorksReport.phases.map((value) => [value.id, value.title] as const), ...completedWorksReport.photos.map((value) => [value.id, value.title] as const)]
    : dailyReport
    ? [...Object.values(dailyReport.sections).flat().map((value) => [value.id, value.title] as const), ...dailyReport.photos.map((value) => [value.id, value.title] as const)]
    : (document.items?.map((item, index) => [String(index), item.description] as const) ?? []);
  const itemEntries =
    document.invoice?.groups.flatMap((g) =>
      g.items.map((i) => [i.id, i.name] as const),
    ) ??
    document.quotation?.variants.flatMap((v) =>
      v.groups.flatMap((g) => g.items.map((i) => [i.id, i.name] as const)),
    ) ??
    document.purchaseOrder?.items.map((i) => [i.id, i.name] as const) ??
    fallbackEntries;
  const groupEntries =
    document.invoice?.groups.map((group) => [group.id, group.name] as const) ??
    document.quotation?.variants.flatMap((variant) =>
      variant.groups.map((group) => [group.id, group.name] as const),
    ) ??
    [];
  function update(next: DocumentVisibilitySettings) {
    onChange({ ...next, profileId: next.profileId || "custom" });
  }
  function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    const next = [
      ...profiles,
      {
        id: crypto.randomUUID(),
        name,
        documentType: document.type,
        settings: { ...settings, profileId: "custom" },
      },
    ];
    setProfiles(next);
    saveVisibilityProfiles(next);
    setProfileName("");
  }
  return (
    <details className="mb-4 rounded-2xl border border-primary/20 bg-primary/[.03]">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <Eye className="size-5 text-primary" />
        <span className="flex-1 font-semibold">Sadržaj dokumenta</span>
        <span className="text-xs text-muted-foreground">
          Kontrola previewa, PDF-a i DOCX-a
        </span>
        <ChevronDown className="size-4" />
      </summary>
      <div className="space-y-4 border-t p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <select
            className="h-10 rounded-xl border bg-background px-3 text-sm"
            value={settings.profileId}
            onChange={(e) =>
              update(applyVisibilityProfile(settings, e.target.value))
            }
          >
            {builtIns.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
            {profiles
              .filter(
                (p) =>
                  p.documentType === document.type || p.documentType === "all",
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => update(applyVisibilityProfile(settings, "full"))}
          >
            Prikaži sve
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => update(applyVisibilityProfile(settings, "minimal"))}
          >
            Sakrij opcionalno
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(settings.sections).map(([id, value]) => (
            <SectionVisibilityControl
              key={id}
              id={id}
              value={value}
              onChange={(section) =>
                update({
                  ...settings,
                  profileId: "custom",
                  sections: { ...settings.sections, [id]: section },
                })
              }
            />
          ))}
        </div>
        {itemEntries.length > 0 && (
          <details className="rounded-xl border">
            <summary className="cursor-pointer list-none p-3 text-sm font-semibold">
              Vidljivost stavki i obračun
            </summary>
            <div className="space-y-2 border-t p-3">
              {itemEntries.map(([id, label]) => {
                const value = settings.items[id] ?? {
                  isVisible: true,
                  includeInCalculation: true,
                };
                return (
                  <div
                    key={id}
                    className={`grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_auto_auto] ${value.isVisible ? "" : "bg-muted opacity-70"}`}
                  >
                    <span className="truncate text-xs">
                      {label || "Stavka"}
                    </span>
                    <VisibilityToggle
                      visible={value.isVisible}
                      onChange={(isVisible) =>
                        update({
                          ...settings,
                          profileId: "custom",
                          items: {
                            ...settings.items,
                            [id]: {
                              isVisible,
                              includeInCalculation: isVisible
                                ? value.includeInCalculation
                                : false,
                            },
                          },
                        })
                      }
                      label={label || "stavka"}
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={value.includeInCalculation}
                        onChange={(e) =>
                          update({
                            ...settings,
                            profileId: "custom",
                            items: {
                              ...settings.items,
                              [id]: {
                                ...value,
                                includeInCalculation: e.target.checked,
                              },
                            },
                          })
                        }
                      />
                      U obračunu
                    </label>
                  </div>
                );
              })}
            </div>
          </details>
        )}
        {groupEntries.length > 0 && (
          <details className="rounded-xl border">
            <summary className="cursor-pointer list-none p-3 text-sm font-semibold">Grupe stavki</summary>
            <div className="space-y-2 border-t p-3">
              {groupEntries.map(([id, label]) => {
                const value = settings.groups[id] ?? { isVisible: true, includeInCalculation: true, showTitle: true, showSubtotal: true };
                return <div key={id} className={`grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_auto_auto] ${value.isVisible ? "" : "bg-muted opacity-70"}`}><span className="truncate text-xs">{label}</span><VisibilityToggle visible={value.isVisible} onChange={(isVisible) => update({ ...settings, profileId: "custom", groups: { ...settings.groups, [id]: { ...value, isVisible } } })} label={`grupa ${label}`} /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={value.includeInCalculation} onChange={(event) => update({ ...settings, profileId: "custom", groups: { ...settings.groups, [id]: { ...value, includeInCalculation: event.target.checked } } })} />U obračunu</label></div>;
              })}
            </div>
          </details>
        )}
        <ColumnVisibilityManager settings={settings} onChange={update} />
        <div className="grid gap-2 border-t pt-4 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Naziv vlastitog profila"
          />
          <Button type="button" variant="outline" onClick={saveProfile}>
            <Plus className="size-4" />
            Spremi profil
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => saveDefaultVisibility(document.type, settings)}
          >
            <Save className="size-4" />
            Zadano za ovu vrstu
          </Button>
        </div>
        {profiles
          .filter((p) => p.documentType === document.type)
          .map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-2 rounded-lg border p-2 text-xs"
            >
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() =>
                  update({ ...profile.settings, profileId: profile.id })
                }
              >
                {profile.name}
              </button>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => {
                  const next = [
                    ...profiles,
                    {
                      ...profile,
                      id: crypto.randomUUID(),
                      name: `${profile.name} kopija`,
                    },
                  ];
                  setProfiles(next);
                  saveVisibilityProfiles(next);
                }}
                aria-label="Dupliraj profil"
              >
                <Copy className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => {
                  const next = profiles.filter((p) => p.id !== profile.id);
                  setProfiles(next);
                  saveVisibilityProfiles(next);
                }}
                aria-label="Obriši profil"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
      </div>
    </details>
  );
}
