"use client";

import {
  Droplets,
  Eye,
  LayoutTemplate,
  Maximize2,
  Paintbrush,
  Printer,
  ShieldCheck,
  Type,
  Waves,
} from "lucide-react";
import {
  applyTheme,
  documentThemes,
  estimateInk,
  fontPairs,
  paperContrast,
  paperPalette,
  paperPresetById,
  paperPresets,
  type DocumentStyleConfig,
  type DocumentThemeId,
  type FontPairId,
  type PaperPattern,
  type WaveDecorationConfig,
} from "@/lib/document-design";
import { documentTypeDefinitions } from "@/lib/document-types";

export function DocumentStylePanel({
  style,
  onChange,
}: {
  style: DocumentStyleConfig;
  onChange: (style: DocumentStyleConfig) => void;
}) {
  const patch = <K extends keyof DocumentStyleConfig>(
    key: K,
    value: DocumentStyleConfig[K],
  ) => onChange({ ...style, [key]: value });
  const paper = (next: DocumentStyleConfig["paper"]) =>
    onChange({ ...style, paper: next, paperColor: next.color.value });
  const contrast = paperContrast(style.paper, style.textColor);
  const ink = estimateInk(style.paper);

  return (
    <details open className="mb-5 overflow-hidden rounded-2xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Paintbrush className="size-4" />
        </span>
        <span className="flex-1">
          <b className="block text-sm">Izgled dokumenta</b>
          <span className="text-xs text-muted-foreground">
            {documentThemes.find((theme) => theme.id === style.themeId)?.name} ·{" "}
            {documentTypeDefinitions[style.documentCharacter].label}
          </span>
        </span>
        <Eye className="size-4 text-muted-foreground" />
      </summary>

      <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
        <Select
          icon={<LayoutTemplate />}
          label="Tema"
          value={style.themeId}
          options={documentThemes.map((theme) => [theme.id, theme.name])}
          onChange={(value) =>
            onChange(applyTheme(style, value as DocumentThemeId))
          }
        />
        <Select
          icon={<Type />}
          label="Font kombinacija"
          value={style.fontPairId}
          options={Object.entries(fontPairs).map(([id, font]) => [id, font.name])}
          onChange={(value) => {
            const font = fontPairs[value as FontPairId];
            onChange({
              ...style,
              fontPairId: value as FontPairId,
              headingFont: font.heading,
              bodyFont: font.body,
              tableFont: font.table,
              smallFont: font.small,
            });
          }}
        />
        <Select
          icon={<Waves />}
          label="Gustoća"
          value={style.density}
          options={[
            ["compact", "Kompaktno"],
            ["comfortable", "Uravnoteženo"],
            ["spacious", "Prozračno"],
          ]}
          onChange={(value) =>
            patch("density", value as DocumentStyleConfig["density"])
          }
        />
        <Select
          icon={<Maximize2 />}
          label="Header"
          value={style.headerVariant}
          options={headerOptions}
          onChange={(value) =>
            patch("headerVariant", value as DocumentStyleConfig["headerVariant"])
          }
        />
        <Select
          icon={<LayoutTemplate />}
          label="Stil tablice"
          value={style.tableVariant}
          options={tableOptions}
          onChange={(value) =>
            patch("tableVariant", value as DocumentStyleConfig["tableVariant"])
          }
        />
        <label className="grid gap-1 text-xs font-medium">
          <span className="flex items-center gap-2">
            <Droplets className="size-4" /> Glavna boja
          </span>
          <input
            type="color"
            value={style.accentColor}
            onChange={(event) => patch("accentColor", event.target.value)}
            className="h-10 w-full rounded-xl border bg-background p-1"
          />
        </label>
        <Range
          label={`Veličina teksta (${style.fontSize}px)`}
          min={8}
          max={14}
          step={0.5}
          value={style.fontSize}
          onChange={(value) => patch("fontSize", value)}
        />
        <Range
          label={`Margine (${style.page.margins.left} mm)`}
          min={8}
          max={25}
          value={style.page.margins.left}
          onChange={(value) =>
            onChange({
              ...style,
              page: {
                ...style.page,
                margins: { top: value, right: value, bottom: value, left: value },
              },
            })
          }
        />
        <Check
          label="Watermark"
          checked={style.watermark.enabled}
          onChange={(enabled) =>
            onChange({
              ...style,
              watermark: { ...style.watermark, enabled },
            })
          }
        />
        {style.watermark.enabled && (
          <input
            aria-label="Tekst watermarka"
            value={style.watermark.text}
            onChange={(event) =>
              onChange({
                ...style,
                watermark: { ...style.watermark, text: event.target.value },
              })
            }
            className="h-10 rounded-xl border px-3 text-sm"
          />
        )}
      </div>

      <details className="border-t" open>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          Papir i pozadina
        </summary>
        <div className="grid gap-4 border-t bg-muted/20 p-4 sm:grid-cols-2">
          <Select
            icon={<LayoutTemplate />}
            label="Paper preset"
            value={style.paper.presetId}
            options={paperPresets.map((preset) => [preset.id, preset.name])}
            onChange={(id) =>
              paper(structuredClone(paperPresetById(id).paper))
            }
          />
          <label className="grid gap-1 text-xs font-medium">
            Boja papira
            <div className="flex gap-2">
              <input
                type="color"
                value={style.paper.color.value}
                onChange={(event) =>
                  paper({
                    ...style.paper,
                    presetId: "custom",
                    color: {
                      ...style.paper.color,
                      value: event.target.value,
                      source: "custom",
                    },
                  })
                }
                className="h-10 w-12 rounded-lg border p-1"
              />
              <input
                aria-label="HEX boja papira"
                value={style.paper.color.value}
                onChange={(event) =>
                  /^#[0-9a-f]{6}$/i.test(event.target.value) &&
                  paper({
                    ...style.paper,
                    presetId: "custom",
                    color: {
                      ...style.paper.color,
                      value: event.target.value,
                      source: "custom",
                    },
                  })
                }
                className="h-10 min-w-0 flex-1 rounded-xl border px-3 uppercase"
              />
            </div>
          </label>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium">Profesionalna paleta</p>
            <div className="flex flex-wrap gap-2">
              {paperPalette.map((color) => (
                <button
                  type="button"
                  key={color.value}
                  title={color.name}
                  aria-label={color.name}
                  onClick={() =>
                    paper({
                      ...style.paper,
                      presetId: "custom",
                      color: {
                        ...style.paper.color,
                        value: color.value,
                        source: "palette",
                      },
                    })
                  }
                  className="size-8 rounded-full border shadow-sm"
                  style={{ background: color.value }}
                />
              ))}
            </div>
          </div>

          <Select
            icon={<Waves />}
            label="Uzorak"
            value={style.paper.pattern.type}
            options={patternOptions}
            onChange={(type) =>
              paper({
                ...style.paper,
                presetId: "custom",
                pattern: {
                  ...style.paper.pattern,
                  enabled: type !== "none",
                  type: type as PaperPattern,
                },
              })
            }
          />
          <Range
            label={`Intenzitet uzorka (${Math.round(style.paper.pattern.opacity * 100)}%)`}
            min={0}
            max={0.25}
            step={0.01}
            value={style.paper.pattern.opacity}
            onChange={(opacity) =>
              paper({
                ...style.paper,
                pattern: { ...style.paper.pattern, opacity },
              })
            }
          />

          <PaperWaveControls
            value={style.paper.wave}
            onChange={(wave) =>
              paper({ ...style.paper, presetId: "custom", wave })
            }
          />

          <Check
            label="Poštuj sigurnu zonu"
            icon={<ShieldCheck className="size-4" />}
            checked={style.paper.safeZone}
            onChange={(safeZone) => paper({ ...style.paper, safeZone })}
          />
          <Check
            label="Print Safe Mode"
            icon={<Printer className="size-4" />}
            checked={style.paper.printSafe.enabled}
            onChange={(enabled) =>
              paper({
                ...style.paper,
                printSafe: { ...style.paper.printSafe, enabled },
              })
            }
          />
          <Check
            label="Crno-bijeli preview"
            checked={style.paper.printSafe.blackAndWhitePreview}
            onChange={(blackAndWhitePreview) =>
              paper({
                ...style.paper,
                printSafe: { ...style.paper.printSafe, blackAndWhitePreview },
              })
            }
          />
          <div
            className={`rounded-xl border p-3 text-xs ${
              contrast.acceptable
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
            }`}
          >
            <b>{contrast.acceptable ? "Kontrast je čitljiv" : "Nedovoljan kontrast"}</b>
            <p className="mt-1">
              Omjer {contrast.ratio.toFixed(1)}:1 · tinta:{" "}
              {ink === "low" ? "mala" : ink === "medium" ? "srednja" : "velika"}
            </p>
            {!contrast.acceptable && (
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => patch("textColor", contrast.suggestion)}
              >
                Automatski ispravi tekst
              </button>
            )}
          </div>
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() =>
              paper(structuredClone(paperPresetById("pure-white").paper))
            }
          >
            Reset papira
          </button>
        </div>
      </details>
    </details>
  );
}

function PaperWaveControls({
  value,
  onChange,
}: {
  value: WaveDecorationConfig;
  onChange: (value: WaveDecorationConfig) => void;
}) {
  const update = <K extends keyof WaveDecorationConfig>(
    key: K,
    next: WaveDecorationConfig[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <fieldset className="grid gap-4 rounded-2xl border bg-background p-4 sm:col-span-2 sm:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">Dekorativni poslovni val</legend>
      <Check
        label="Prikaži val na dokumentu"
        icon={<Waves className="size-4" />}
        checked={value.enabled}
        onChange={(enabled) => update("enabled", enabled)}
      />
      <Check
        label="Okreni smjer vala"
        checked={value.flip}
        onChange={(flip) => update("flip", flip)}
      />
      {value.enabled && (
        <>
          <Select
            icon={<Waves />}
            label="Stil vala"
            value={value.style}
            options={[
              ["corporate-ribbon", "Korporativna traka"],
              ["soft-curve", "Meka krivulja"],
              ["double-flow", "Dvostruki tok"],
            ]}
            onChange={(style) =>
              update("style", style as WaveDecorationConfig["style"])
            }
          />
          <Select
            icon={<LayoutTemplate />}
            label="Položaj"
            value={value.position}
            options={[
              ["header", "Ispod zaglavlja"],
              ["middle", "Sredina stranice"],
              ["footer", "Iznad podnožja"],
            ]}
            onChange={(position) =>
              onChange({
                ...value,
                position: position as WaveDecorationConfig["position"],
                offset:
                  position === "header" ? 28 : position === "middle" ? 48 : 74,
              })
            }
          />
          <Color label="Glavna boja vala" value={value.primaryColor} onChange={(color) => update("primaryColor", color)} />
          <Color label="Sekundarna boja vala" value={value.secondaryColor} onChange={(color) => update("secondaryColor", color)} />
          <Range label={`Visina vala (${value.height}%)`} min={8} max={35} value={value.height} onChange={(height) => update("height", height)} />
          <Range label={`Položaj na stranici (${value.offset}%)`} min={8} max={88} value={value.offset} onChange={(offset) => update("offset", offset)} />
          <Range label={`Intenzitet (${Math.round(value.opacity * 100)}%)`} min={0.15} max={1} step={0.05} value={value.opacity} onChange={(opacity) => update("opacity", opacity)} />
        </>
      )}
    </fieldset>
  );
}

function Select({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium">
      <span className="flex items-center gap-2 [&_svg]:size-4">
        {icon} {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border bg-background px-3 text-sm"
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Range({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-medium">{label}<input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border bg-background p-1" /></label>;
}

function Check({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (checked: boolean) => void; icon?: React.ReactNode }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{icon}{label}</label>;
}

const headerOptions: Array<[string, string]> = [
  ["classic-business", "Klasični poslovni"],
  ["modern-split", "Moderni podijeljeni"],
  ["hero-title", "Veliki naslov"],
  ["side-rail", "Bočna traka"],
  ["dark", "Tamni header"],
  ["minimal", "Minimalistički"],
  ["logo-centered", "Logo centriran"],
  ["company-card", "Firma u kartici"],
];

const tableOptions: Array<[string, string]> = [
  ["solid", "Puna zaglavlja"],
  ["striped", "Naizmjenični redovi"],
  ["minimal", "Minimalna"],
  ["technical", "Tehnička"],
  ["executive", "Executive"],
];

const patternOptions: Array<[string, string]> = [
  ["none", "Bez uzorka"],
  ["horizontal-lines", "Horizontalne linije"],
  ["vertical-lines", "Vertikalne linije"],
  ["technical-grid", "Tehnička mreža"],
  ["dot-grid", "Točkasta mreža"],
  ["diagonal-lines", "Dijagonalne linije"],
  ["geometry", "Geometrijske linije"],
  ["corner-details", "Kutni detalji"],
  ["side-line", "Bočna linija"],
  ["top-line", "Gornja linija"],
  ["bottom-line", "Donja linija"],
  ["page-frame", "Okvir stranice"],
  ["blueprint", "Tehnički nacrt"],
  ["construction-grid", "Građevinski grid"],
  ["corporate-waves", "Korporativni valovi"],
  ["minimal-shapes", "Minimalistički oblici"],
  ["elegant-curves", "Elegantne krivulje"],
  ["paper-texture", "Papirni uzorak"],
];
