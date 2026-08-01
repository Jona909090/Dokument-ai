"use client";

import Image from "next/image";
import {
  calculateQuotationItem,
  calculateQuotationVariant,
  type QuotationCompany,
  type QuotationData,
} from "@/lib/quotation";
import {
  formatDocumentDate,
  type GeneratedImages,
} from "@/lib/generated-document";

export function QuotationSheet({
  data,
  images,
  compact = false,
}: {
  data: QuotationData;
  images?: GeneratedImages;
  compact?: boolean;
}) {
  const accent =
    data.template === "classic"
      ? "#1e3a5f"
      : data.template === "modern"
        ? "#2563eb"
        : "#111827";
  const money = (cents: number) => {
    try {
      return new Intl.NumberFormat(data.language === "hr" ? "hr-HR" : "en-GB", {
        style: "currency",
        currency: data.currency,
      }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${data.currency}`;
    }
  };
  const selected = data.variants.filter(
    (v) => v.visible && v.selectedForExport,
  );
  const templateClass =
    data.template === "classic"
      ? "font-serif"
      : data.template === "modern"
        ? "font-sans [&_section]:rounded-md"
        : "font-sans tracking-tight";
  return (
    <article
      className={`mx-auto flex w-full max-w-[210mm] flex-col bg-white text-slate-900 ${templateClass} ${compact ? "h-full min-h-full p-[5%] text-[5.3px]" : "min-h-[297mm] px-[14mm] py-[12mm] text-[9.5px]"}`}
      style={{ "--offer-accent": accent } as React.CSSProperties}
    >
      <header
        className={`${data.headerLayout === "logo-top" ? "block" : "flex items-start justify-between"} gap-5 border-b-2 pb-3`}
        style={{ borderColor: accent }}
      >
        {data.headerLayout !== "no-logo" &&
          data.headerLayout !== "minimal" &&
          images?.logo && (
            <Image
              src={images.logo}
              alt="Logotip firme"
              width={compact ? 60 : 110}
              height={compact ? 24 : 42}
              unoptimized
              className={`${data.headerLayout === "logo-top" ? "mb-2" : ""} max-h-11 max-w-28 object-contain`}
            />
          )}
        <CompanyDetails
          company={data.company}
          minimal={data.headerLayout === "minimal"}
        />
        <div
          className={data.headerLayout === "logo-top" ? "mt-2" : "text-right"}
        >
          <h1
            className={compact ? "text-[13px] font-bold" : "text-2xl font-bold"}
          >
            PONUDA
          </h1>
          <p className="font-semibold">{data.number}</p>
          <p>
            {formatDocumentDate(data.issueDate, data.language)}
            {data.validUntil &&
              ` · vrijedi do ${formatDocumentDate(data.validUntil, data.language)}`}
          </p>
          <p className="capitalize text-slate-500">{data.status}</p>
        </div>
      </header>
      <section className="mt-3 grid grid-cols-2 gap-3">
        <Box title="KUPAC" accent={accent}>
          <strong>{data.customer.name}</strong>
          <p>{data.customer.address}</p>
          <p>
            {[
              data.customer.postalCode,
              data.customer.city,
              data.customer.country,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
          {data.customer.taxNumber && (
            <p>OIB / PIB: {data.customer.taxNumber}</p>
          )}
          <p>
            {[
              data.customer.contactPerson,
              data.customer.phone,
              data.customer.email,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </Box>
        <Box title="PODACI PONUDE" accent={accent}>
          <Meta label="Predmet" value={data.subject} />
          <Meta label="Referenca" value={data.referenceNumber} />
          <Meta
            label="Projekt / gradilište"
            value={[data.project, data.site].filter(Boolean).join(" · ")}
          />
          <Meta label="Odgovorna osoba" value={data.responsiblePerson} />
          <Meta label="Prodajni predstavnik" value={data.salesRepresentative} />
          <Meta label="Mjesto" value={data.issuePlace} />
        </Box>
      </section>
      {data.introBlocks
        .filter((b) => b.visible && b.content)
        .map((block) => (
          <section key={block.id} className="mt-3 break-inside-avoid">
            <h2 className="font-bold" style={{ color: accent }}>
              {block.title}
            </h2>
            <p className="mt-1 whitespace-pre-wrap">{block.content}</p>
          </section>
        ))}
      {selected.map((variant) => {
        const summary = calculateQuotationVariant(
          variant,
          data.charges,
          data.globalDiscountRate,
        );
        return (
          <section key={variant.id} className="mt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.35em] font-bold" style={{ color: accent }}>
                {variant.name}
              </h2>
              {variant.recommended && (
                <span
                  className="rounded-full px-2 py-0.5 text-[.8em] text-white"
                  style={{ backgroundColor: accent }}
                >
                  PREPORUČENO
                </span>
              )}
            </div>
            {variant.groups
              .filter((g) => g.visible)
              .map((group) => (
                <div key={group.id} className="mt-2">
                  <h3
                    className="border-b py-1 font-bold"
                    style={{ borderColor: accent }}
                  >
                    {group.name}
                    {data.showPrices &&
                      group.discountRate > 0 &&
                      ` · popust grupe ${group.discountRate}%`}
                  </h3>
                  <table className="w-full table-fixed border-collapse">
                    <thead className="[display:table-header-group]">
                      <tr
                        className="text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <th className="w-[5%] p-1 text-center">#</th>
                        <th
                          className={
                            data.showPrices
                              ? "w-[43%] p-1 text-left"
                              : "w-[77%] p-1 text-left"
                          }
                        >
                          Šifra / naziv i opis
                        </th>
                        <th className="w-[9%] p-1 text-right">Kol.</th>
                        <th className="w-[9%] p-1 text-center">JM</th>
                        {data.showPrices && (
                          <>
                            <th className="w-[12%] p-1 text-right">Cijena</th>
                            <th className="w-[8%] p-1 text-right">Popust</th>
                            <th className="w-[7%] p-1 text-right">PDV</th>
                            <th className="w-[12%] p-1 text-right">Ukupno</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {group.items
                        .filter((i) => i.visible)
                        .map((item, index) => {
                          const amount = calculateQuotationItem(
                            item,
                            group.discountRate,
                            data.globalDiscountRate,
                          );
                          return (
                            <tr
                              key={item.id}
                              className="break-inside-avoid border-b align-top"
                            >
                              <td className="p-1 text-center">{index + 1}</td>
                              <td className="p-1">
                                <strong>
                                  {item.code && `${item.code} · `}
                                  {item.name || "—"}
                                </strong>
                                {item.description && (
                                  <span className="block text-slate-500">
                                    {item.description}
                                  </span>
                                )}
                                {item.note && (
                                  <span className="block italic text-slate-500">
                                    {item.note}
                                  </span>
                                )}
                              </td>
                              <td className="p-1 text-right">
                                {item.quantity}
                              </td>
                              <td className="p-1 text-center">{item.unit}</td>
                              {data.showPrices && (
                                <>
                                  <td className="p-1 text-right">
                                    {money(Math.round(item.unitPrice * 100))}
                                  </td>
                                  <td className="p-1 text-right">
                                    {item.discountRate}%
                                  </td>
                                  <td className="p-1 text-right">
                                    {item.taxRate}%
                                  </td>
                                  <td className="p-1 text-right font-semibold">
                                    {money(amount.totalCents)}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
            {data.showPrices && (
              <SummaryView data={data} summary={summary} money={money} />
            )}
          </section>
        );
      })}
      {data.conditions
        .filter((b) => b.visible && b.content)
        .map((block) => (
          <section
            key={block.id}
            className="mt-3 break-inside-avoid rounded border p-2"
          >
            <h2 className="font-bold" style={{ color: accent }}>
              {block.title}
            </h2>
            <p className="mt-1 whitespace-pre-wrap">{block.content}</p>
          </section>
        ))}
      {data.showAcceptanceText && data.acceptanceText && (
        <p
          className="mt-4 break-inside-avoid border-l-2 pl-2 italic"
          style={{ borderColor: accent }}
        >
          {data.acceptanceText}
        </p>
      )}
      <section className="mt-5 grid grid-cols-2 gap-4 break-inside-avoid">
        {data.signatures
          .filter((s) => s.visible)
          .map((signature) => (
            <div
              key={signature.id}
              className="min-h-16 border-t pt-2 text-center"
            >
              <strong>{signature.title}</strong>
              <p className="mt-2">{signature.name}</p>
              <p className="text-slate-500">{signature.role}</p>
              <p>{formatDocumentDate(signature.date, data.language)}</p>
            </div>
          ))}
      </section>
      {(images?.signature || images?.stamp) && (
        <div className="mt-2 flex justify-end gap-3">
          {images.signature && (
            <Image
              src={images.signature}
              alt="Potpis"
              width={100}
              height={40}
              unoptimized
              className="h-10 max-w-24 object-contain"
            />
          )}
          {images.stamp && (
            <Image
              src={images.stamp}
              alt="Pečat"
              width={70}
              height={50}
              unoptimized
              className="h-12 max-w-16 object-contain"
            />
          )}
        </div>
      )}
      <footer className="mt-auto flex justify-between border-t pt-2 text-slate-500">
        <span>{data.company.name || "Ponuda"}</span>
        <span>Stranica 1</span>
      </footer>
    </article>
  );
}
function CompanyDetails({
  company,
  minimal,
}: {
  company: QuotationCompany;
  minimal: boolean;
}) {
  const values = Object.entries(company).filter(
    ([k, v]) =>
      k !== "visible" &&
      company.visible[k as keyof typeof company.visible] &&
      v,
  );
  if (minimal)
    return (
      <div>
        <strong>{company.visible.name ? company.name : ""}</strong>
        {company.visible.email && <p>{company.email}</p>}
      </div>
    );
  return (
    <div>
      {values.map(([key, value]) => (
        <p
          key={key}
          className={key === "name" ? "font-bold text-[1.15em]" : ""}
        >
          {key === "taxNumber"
            ? `OIB / PIB: ${value}`
            : key === "vatNumber"
              ? `PDV: ${value}`
              : key === "iban"
                ? `IBAN: ${value}`
                : key === "swift"
                  ? `SWIFT: ${value}`
                  : String(value)}
        </p>
      ))}
    </div>
  );
}
function Box({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded border p-2">
      <h2 className="mb-1 border-b pb-1 font-bold" style={{ color: accent }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return value ? (
    <p>
      <span className="text-slate-500">{label}: </span>
      {value}
    </p>
  ) : null;
}
function SummaryView({
  data,
  summary,
  money,
}: {
  data: QuotationData;
  summary: ReturnType<typeof calculateQuotationVariant>;
  money: (v: number) => string;
}) {
  return (
    <dl className="ml-auto mt-2 w-[48%] space-y-0.5">
      <Line label="Bruto vrijednost" value={money(summary.grossCents)} />
      <Line label="Ukupni popust" value={`− ${money(summary.discountCents)}`} />
      {data.charges
        .filter((charge) => charge.visible)
        .map((charge) => (
          <Line
            key={charge.id}
            label={charge.name}
            value={money(Math.round(charge.amount * 100))}
          />
        ))}
      <Line label="Dodatni troškovi" value={money(summary.chargesCents)} />
      <Line label="Osnovica bez PDV-a" value={money(summary.subtotalCents)} />
      {Object.entries(summary.taxByRate).map(([rate, value]) => (
        <Line key={rate} label={`PDV ${rate}%`} value={money(value)} />
      ))}
      <div className="flex justify-between border-t-2 pt-1 font-bold">
        <dt>Ukupno s PDV-om</dt>
        <dd>
          {money(summary.totalCents)} {data.currency === "EUR" ? "" : ""}
        </dd>
      </div>
    </dl>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
