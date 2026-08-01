import Image from "next/image";
import {
  calculateDailyStats,
  dailySectionLabels,
  type DailyReportData,
  type DailySectionId,
} from "@/lib/daily-report";
import { formatDocumentDate } from "@/lib/generated-document";
export function DailyReportSheet({
  data,
  compact = false,
}: {
  data: DailyReportData;
  compact?: boolean;
}) {
  const stats = calculateDailyStats(data);
  const accent =
    data.template === "modern"
      ? "#2563eb"
      : data.template === "executive"
        ? "#0f766e"
        : "#1e293b";
  const sections = Object.keys(dailySectionLabels) as DailySectionId[];
  const photoColumns =
    data.photoLayout === "one"
      ? "grid-cols-1"
      : data.photoLayout === "two"
        ? "grid-cols-2"
        : "grid-cols-2";
  return (
    <article
      className={`flex min-h-[297mm] w-full flex-col bg-white text-slate-900 ${compact ? "origin-top scale-[.52]" : ""}`}
      style={{
        width: compact ? "192%" : undefined,
        padding: compact ? "9mm 11mm" : "13mm 15mm",
        fontSize: compact ? 10 : 11,
      }}
    >
      <header
        className="flex justify-between gap-6 border-b-2 pb-3"
        style={{ borderColor: accent }}
      >
        <div>
          <p
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            Dnevni izvještaj sa gradilišta
          </p>
          <h1 className="mt-1 text-xl font-black">
            {data.projectName || "Projekt"}
          </h1>
          <p className="text-xs text-slate-500">
            {data.siteName} · {data.siteAddress}
          </p>
        </div>
        <div className="text-right">
          <strong className="text-base">{data.number}</strong>
          <p>
            {formatDocumentDate(data.date, "hr")} · {data.day}
          </p>
          <span
            className="mt-1 inline-block rounded px-2 py-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {data.status}
          </span>
        </div>
      </header>
      <section className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-[9px]">
        <Meta label="Investitor" value={data.investor} />
        <Meta label="Glavni izvođač" value={data.mainContractor} />
        <Meta label="Nadzor" value={data.supervision} />
        <Meta label="Voditelj gradilišta" value={data.siteManager} />
        <Meta label="Poslovođa" value={data.foreman} />
        <Meta label="Faza" value={data.projectPhase} />
      </section>
      <section className="my-3 grid grid-cols-4 gap-2 text-center">
        <Stat label="Radnika" value={stats.workers} />
        <Stat label="Radnih sati" value={stats.workHours} />
        <Stat label="Izvedenih radova" value={stats.completedWorks} />
        <Stat label="Otvorenih problema" value={stats.openProblems} />
      </section>
      <div className="flex-1">
        {sections
          .filter((id) => id !== "photos")
          .map((id) => {
            const values = data.sections[id].filter((value) => value.visible);
            if (!values.length) return null;
            return (
              <section key={id} className="mb-4">
                <h2
                  className="mb-1 border-b pb-1 text-xs font-bold"
                  style={{ color: accent }}
                >
                  {dailySectionLabels[id]}
                </h2>
                {id === "notes" || id === "safety" || id === "custom" ? (
                  <div className="space-y-2">
                    {values.map((value) => (
                      <div
                        key={value.id}
                        className="break-inside-avoid rounded border p-2"
                      >
                        <strong>{value.title}</strong>
                        {Object.entries(value.fields)
                          .filter(([, field]) => String(field))
                          .map(([key, field]) => (
                            <p key={key}>
                              <span className="text-slate-500">{key}: </span>
                              {String(field)}
                            </p>
                          ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full border-collapse text-[8px]">
                    <thead className="table-header-group">
                      <tr
                        className="text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <th className="p-1 text-left">Zapis</th>
                        <th className="p-1 text-left">Detalji</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.map((value) => (
                        <tr
                          key={value.id}
                          className="break-inside-avoid border-b align-top"
                        >
                          <td className="w-[24%] p-1 font-semibold">
                            {value.title}
                          </td>
                          <td className="p-1">
                            {Object.entries(value.fields)
                              .filter(([, field]) => String(field))
                              .map(([key, field]) => (
                                <span key={key} className="mr-3 inline-block">
                                  <b>{key}:</b> {String(field)}
                                </span>
                              ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
        {data.photos.filter((photo) => photo.visible).length > 0 && (
          <section className="mb-4">
            <h2
              className="mb-2 border-b pb-1 text-xs font-bold"
              style={{ color: accent }}
            >
              Fotografije
            </h2>
            <div className={`grid ${photoColumns} gap-2`}>
              {data.photos
                .filter((photo) => photo.visible)
                .map((photo) => (
                  <figure
                    key={photo.id}
                    className="break-inside-avoid rounded border p-1"
                  >
                    <Image
                      src={photo.dataUrl}
                      alt={photo.title}
                      width={500}
                      height={300}
                      unoptimized
                      className="h-36 w-full object-cover"
                    />
                    <figcaption className="mt-1">
                      <strong>{photo.title}</strong>
                      <p className="text-[8px] text-slate-500">
                        {photo.description} {photo.location}
                      </p>
                    </figcaption>
                  </figure>
                ))}
            </div>
          </section>
        )}
        {data.showSafetyDisclaimer && (
          <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-[8px] font-semibold text-amber-900">
            {data.safetyDisclaimer}
          </p>
        )}
      </div>
      <footer className="mt-4 flex justify-between border-t pt-2 text-[8px] text-slate-500">
        <span>{data.projectName || "Dnevni izvještaj"}</span>
        <span>Stranica 1</span>
      </footer>
    </article>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="block text-slate-500">{label}</strong>
      <span>{value || "—"}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-2">
      <strong className="block text-base">{value}</strong>
      <span className="text-[8px] text-slate-500">{label}</span>
    </div>
  );
}
