"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalSession } from "@/components/session/local-session-provider";
import { useRepositories } from "@/lib/data/use-local-data";
import type {
  DocumentLocale,
  GeneratedDocument,
} from "@/lib/generated-document";
import {
  calculateDailyStats,
  copyPreviousDailyReport,
  createDailyRecord,
  createDailyReport,
  dailySectionLabels,
  type DailyRecord,
  type DailyReportData,
  type DailySectionId,
} from "@/lib/daily-report";
type Props = {
  locale: DocumentLocale;
  onPreview: (document: GeneratedDocument) => void;
  onLiveChange?: (document: GeneratedDocument) => void;
};
const sections = Object.keys(dailySectionLabels) as DailySectionId[];
const input = "h-10 w-full rounded-xl border bg-background px-3 text-sm";
const move = <T,>(values: T[], index: number, direction: -1 | 1) => {
  const next = [...values],
    target = index + direction;
  if (target < 0 || target >= next.length) return values;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
export function DailyReportForm({ locale, onPreview, onLiveChange }: Props) {
  const [data, setData] = useState<DailyReportData>(createDailyReport);
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const stats = useMemo(() => calculateDailyStats(data), [data]);
  const generated = useMemo<GeneratedDocument>(
    () => ({
      type: "daily-report",
      title: "Dnevni izvještaj sa gradilišta",
      locale,
      fields: [],
      dailyReport: data,
    }),
    [data, locale],
  );
  useEffect(() => onLiveChange?.(generated), [generated, onLiveChange]);
  const set = <K extends keyof DailyReportData>(
    key: K,
    value: DailyReportData[K],
  ) => setData((current) => ({ ...current, [key]: value }));
  const records = (id: DailySectionId) => data.sections[id];
  const setRecords = (id: DailySectionId, value: DailyRecord[]) =>
    setData((current) => ({
      ...current,
      sections: { ...current.sections, [id]: value },
    }));
  function previous() {
    const report = repositories?.documents
      .list(user.id)
      .find(
        (entry) =>
          entry.documentType === "daily-report" && entry.content.dailyReport,
      )?.content.dailyReport;
    if (!report) {
      alert("Nema prethodnog spremljenog dnevnog izvještaja.");
      return;
    }
    const selected: DailySectionId[] = [
      "workforce",
      "equipment",
      "problems",
      "plannedWorks",
      "materials",
      "signatures",
      "custom",
    ];
    if (
      confirm(
        `Kopirati ${selected.map((id) => dailySectionLabels[id]).join(", ")}? Datum, broj, završeni radovi i fotografije neće se kopirati.`,
      )
    )
      setData(copyPreviousDailyReport(report, selected));
  }
  async function photos(files: FileList | null) {
    if (!files) return;
    const loaded = await Promise.all(
      [...files].map(
        (file) =>
          new Promise<DailyReportData["photos"][number]>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error);
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                title: file.name,
                description: "",
                dateTime: new Date().toISOString().slice(0, 16),
                location: "",
                category: "izvedeni radovi",
                relatedWork: "",
                relatedProblem: "",
                dataUrl: String(reader.result),
                visible: true,
              });
            reader.readAsDataURL(file);
          }),
      ),
    );
    set("photos", [...data.photos, ...loaded]);
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onPreview(generated);
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={previous}>
          Kopiraj prethodni dnevni izvještaj
        </Button>
        <span className="ml-auto rounded-xl bg-muted px-3 py-2 text-xs">
          {stats.workers} radnika · {stats.workHours} sati ·{" "}
          {stats.completedWorks} radova · {stats.openProblems} otvorenih
          problema
        </span>
      </div>
      <Section title="Osnovni podaci izvještaja" open>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Text
            label="Broj izvještaja"
            value={data.number}
            onChange={(value) => set("number", value)}
          />
          <Text
            label="Format broja"
            value={data.numberFormat}
            onChange={(value) => set("numberFormat", value)}
          />
          <Text
            label="Datum"
            value={data.date}
            type="date"
            onChange={(value) => set("date", value)}
          />
          <Text
            label="Dan"
            value={data.day}
            onChange={(value) => set("day", value)}
          />
          {(
            [
              "projectName",
              "siteName",
              "siteAddress",
              "investor",
              "mainContractor",
              "subcontractor",
              "supervision",
              "siteManager",
              "foreman",
              "responsiblePerson",
              "contractNumber",
              "workOrderNumber",
              "projectPhase",
            ] as const
          ).map((key) => (
            <Text
              key={key}
              label={
                {
                  projectName: "Projekt",
                  siteName: "Gradilište",
                  siteAddress: "Adresa gradilišta",
                  investor: "Investitor",
                  mainContractor: "Glavni izvođač",
                  subcontractor: "Podizvođač",
                  supervision: "Nadzor",
                  siteManager: "Voditelj gradilišta",
                  foreman: "Poslovođa",
                  responsiblePerson: "Odgovorna osoba",
                  contractNumber: "Broj ugovora",
                  workOrderNumber: "Radni nalog",
                  projectPhase: "Faza projekta",
                }[key]
              }
              value={data[key]}
              onChange={(value) => set(key, value)}
            />
          ))}
          <Select
            label="Status dana"
            value={data.status}
            options={[
              "radovi izvedeni",
              "djelimično izvedeni",
              "radovi zaustavljeni",
              "neradni dan",
              "čekanje materijala",
              "čekanje nacrta ili odobrenja",
              "vremenski uvjeti",
              "sigurnosni zastoj",
              "drugo",
            ]}
            onChange={(value) => set("status", value)}
          />
          <Select
            label="A4 predložak"
            value={data.template}
            options={["classic", "modern", "executive"]}
            onChange={(value) =>
              set("template", value as DailyReportData["template"])
            }
          />
        </div>
      </Section>
      {sections
        .filter((id) => id !== "photos")
        .map((id) => (
          <RecordSection
            key={id}
            id={id}
            values={records(id)}
            onChange={(value) => setRecords(id, value)}
          />
        ))}
      <Section title="Fotografije">
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm">
            <ImagePlus className="size-4" />
            Dodaj fotografije
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => photos(event.target.files)}
            />
          </label>
          <Select
            label="Izgled"
            value={data.photoLayout}
            options={["one", "two", "four", "gallery"]}
            onChange={(value) =>
              set("photoLayout", value as DailyReportData["photoLayout"])
            }
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {data.photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`rounded-xl border p-3 ${photo.visible ? "" : "bg-muted opacity-60"}`}
            >
              <Image
                src={photo.dataUrl}
                alt={photo.title}
                width={500}
                height={280}
                unoptimized
                className="h-36 w-full rounded-lg object-cover"
              />
              <Text
                label="Naslov"
                value={photo.title}
                onChange={(title) =>
                  set(
                    "photos",
                    data.photos.map((value) =>
                      value.id === photo.id ? { ...value, title } : value,
                    ),
                  )
                }
              />
              <Text
                label="Opis"
                value={photo.description}
                onChange={(description) =>
                  set(
                    "photos",
                    data.photos.map((value) =>
                      value.id === photo.id ? { ...value, description } : value,
                    ),
                  )
                }
              />
              <Text
                label="Lokacija"
                value={photo.location}
                onChange={(location) =>
                  set(
                    "photos",
                    data.photos.map((value) =>
                      value.id === photo.id ? { ...value, location } : value,
                    ),
                  )
                }
              />
              <div className="mt-2 flex gap-1">
                <Icon
                  label="Sakrij/prikaži"
                  onClick={() =>
                    set(
                      "photos",
                      data.photos.map((value) =>
                        value.id === photo.id
                          ? { ...value, visible: !value.visible }
                          : value,
                      ),
                    )
                  }
                >
                  {photo.visible ? <Eye /> : <EyeOff />}
                </Icon>
                <Icon
                  label="Gore"
                  onClick={() => set("photos", move(data.photos, index, -1))}
                >
                  ↑
                </Icon>
                <Icon
                  label="Dolje"
                  onClick={() => set("photos", move(data.photos, index, 1))}
                >
                  ↓
                </Icon>
                <Icon
                  label="Obriši"
                  onClick={() =>
                    set(
                      "photos",
                      data.photos.filter((value) => value.id !== photo.id),
                    )
                  }
                >
                  <Trash2 />
                </Icon>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Sigurnosno upozorenje">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.showSafetyDisclaimer}
            onChange={(event) =>
              set("showSafetyDisclaimer", event.target.checked)
            }
          />
          Prikaži upozorenje
        </label>
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border p-3 text-sm"
          value={data.safetyDisclaimer}
          onChange={(event) => set("safetyDisclaimer", event.target.value)}
        />
      </Section>
      <Button type="submit" className="w-full">
        Pregledaj dnevni izvještaj
      </Button>
    </form>
  );
}
function RecordSection({
  id,
  values,
  onChange,
}: {
  id: DailySectionId;
  values: DailyRecord[];
  onChange: (values: DailyRecord[]) => void;
}) {
  return (
    <Section title={dailySectionLabels[id]}>
      <div className="space-y-3">
        {values.map((record, index) => (
          <div
            key={record.id}
            className={`rounded-xl border p-3 ${record.visible ? "" : "bg-muted opacity-60"}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <GripVertical className="size-4" />
              <Input
                className="min-w-44 flex-1"
                value={record.title}
                onChange={(event) =>
                  onChange(
                    values.map((value) =>
                      value.id === record.id
                        ? { ...value, title: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Icon
                label="Sakrij/prikaži"
                onClick={() =>
                  onChange(
                    values.map((value) =>
                      value.id === record.id
                        ? { ...value, visible: !value.visible }
                        : value,
                    ),
                  )
                }
              >
                {record.visible ? <Eye /> : <EyeOff />}
              </Icon>
              <label className="text-xs">
                <input
                  type="checkbox"
                  checked={record.includeInStatistics}
                  onChange={(event) =>
                    onChange(
                      values.map((value) =>
                        value.id === record.id
                          ? {
                              ...value,
                              includeInStatistics: event.target.checked,
                            }
                          : value,
                      ),
                    )
                  }
                />{" "}
                Statistika
              </label>
              <Icon
                label="Dupliraj"
                onClick={() =>
                  onChange([
                    ...values.slice(0, index + 1),
                    { ...structuredClone(record), id: crypto.randomUUID() },
                    ...values.slice(index + 1),
                  ])
                }
              >
                <Copy />
              </Icon>
              <Icon
                label="Gore"
                onClick={() => onChange(move(values, index, -1))}
              >
                ↑
              </Icon>
              <Icon
                label="Dolje"
                onClick={() => onChange(move(values, index, 1))}
              >
                ↓
              </Icon>
              <Icon
                label="Obriši"
                onClick={() =>
                  onChange(values.filter((value) => value.id !== record.id))
                }
              >
                <Trash2 />
              </Icon>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(record.fields).map(([key, value]) => (
                <label key={key} className="text-xs font-medium">
                  {key}
                  <input
                    className={input}
                    value={String(value)}
                    onChange={(event) =>
                      onChange(
                        values.map((item) =>
                          item.id === record.id
                            ? {
                                ...item,
                                fields: {
                                  ...item.fields,
                                  [key]: event.target.value,
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => onChange([...values, createDailyRecord(id)])}
      >
        <Plus className="size-4" />
        Dodaj zapis
      </Button>
    </Section>
  );
}
function Section({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded-2xl border">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
        {title}
        <ChevronDown className="size-4" />
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}
function Text({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-xs font-medium">
      {label}
      <input
        type={type}
        className={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium">
      {label}
      <select
        className={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Icon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
