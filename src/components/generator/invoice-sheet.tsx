import Image from "next/image";
import {
  calculateInvoice,
  calculateInvoiceItem,
  type InvoiceData,
} from "@/lib/invoice";
import {
  formatDocumentDate,
  type GeneratedImages,
} from "@/lib/generated-document";

const labels = {
  hr: {
    invoice: "FAKTURA",
    customer: "KUPAC",
    issue: "Datum izdavanja",
    due: "Dospijeće",
    service: "Isporuka / usluga",
    item: "Naziv / opis",
    qty: "Kol.",
    unit: "JM",
    price: "Cijena",
    discount: "Popust",
    tax: "PDV",
    amount: "Ukupno",
    subtotal: "Porezna osnovica",
    paid: "Plaćeno",
    remaining: "ZA UPLATU",
    payments: "EVIDENTIRANE UPLATE",
    payment: "PODACI ZA PLAĆANJE",
    page: "Stranica",
  },
  en: {
    invoice: "INVOICE",
    customer: "CUSTOMER",
    issue: "Issue date",
    due: "Due date",
    service: "Supply date",
    item: "Item / description",
    qty: "Qty",
    unit: "Unit",
    price: "Price",
    discount: "Discount",
    tax: "VAT",
    amount: "Total",
    subtotal: "Tax base",
    paid: "Paid",
    remaining: "AMOUNT DUE",
    payments: "PAYMENTS",
    payment: "PAYMENT DETAILS",
    page: "Page",
  },
};
function money(cents: number, data: InvoiceData) {
  try {
    return new Intl.NumberFormat(data.language === "en" ? "en-GB" : "hr-HR", {
      style: "currency",
      currency: data.currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${data.currency}`;
  }
}
function partyLines(
  party: InvoiceData["customer"],
  company?: InvoiceData["company"],
) {
  const shown = (key: string) => !company || company.visible[key] !== false;
  return [
    shown("name") && party.name,
    shown("address") && party.address,
    shown("city") && [party.postalCode, party.city].filter(Boolean).join(" "),
    shown("country") && party.country,
    shown("taxNumber") && party.taxNumber && `OIB / PIB: ${party.taxNumber}`,
    shown("vatNumber") && party.vatNumber && `PDV: ${party.vatNumber}`,
    shown("contactPerson") &&
      party.contactPerson &&
      `Kontakt: ${party.contactPerson}`,
    shown("phone") && party.phone,
    shown("email") && party.email,
  ].filter(Boolean) as string[];
}
export function InvoiceSheet({
  data,
  images,
  compact = false,
}: {
  data: InvoiceData;
  images?: GeneratedImages;
  compact?: boolean;
}) {
  const summary = calculateInvoice(data);
  const t = labels[data.language];
  const accent =
    data.template === "modern"
      ? "#2563eb"
      : data.template === "minimal"
        ? "#334155"
        : "#0f172a";
  const title =
    data.type === "storno"
      ? "STORNO FAKTURA"
      : data.type === "proforma"
        ? "PREDRAČUN / PROFORMA"
        : t.invoice;
  return (
    <article
      className={`relative flex min-h-[297mm] w-full flex-col bg-white text-slate-900 ${compact ? "origin-top scale-[.52]" : ""}`}
      style={{
        width: compact ? "192%" : undefined,
        padding: compact ? "9mm 11mm" : "14mm 16mm",
        fontSize: compact ? 11 : 12,
      }}
    >
      <header
        className={`${data.headerLayout === "logo-top" ? "block" : "flex justify-between gap-8"} border-b-2 pb-4`}
        style={{ borderColor: accent }}
      >
        <div
          className={data.headerLayout === "logo-top" ? "mb-3" : "max-w-[55%]"}
        >
          {images?.logo && data.headerLayout !== "minimal" && (
            <Image
              src={images.logo}
              alt="Logotip"
              width={150}
              height={54}
              unoptimized
              className="mb-2 max-h-14 max-w-40 object-contain"
            />
          )}
          <div className="space-y-0.5">
            {partyLines(data.company, data.company).map((line, index) => (
              <p
                key={line}
                className={
                  index === 0
                    ? "font-bold text-base"
                    : "text-[10px] text-slate-600"
                }
              >
                {line}
              </p>
            ))}
            {data.company.visible.registrationNumber !== false &&
              data.company.registrationNumber && (
                <p className="text-[10px] text-slate-600">
                  Matični broj: {data.company.registrationNumber}
                </p>
              )}
            {data.company.visible.website !== false && data.company.website && (
              <p className="text-[10px] text-slate-600">
                {data.company.website}
              </p>
            )}
          </div>
        </div>
        <div
          className={
            data.headerLayout === "logo-top" ? "text-left" : "text-right"
          }
        >
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: accent }}
          >
            {title}
          </h1>
          <p className="mt-1 text-lg font-bold">{data.number || "—"}</p>
          <p
            className="mt-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${accent}12` }}
          >
            {data.status}
          </p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-4">
        <div>
          <h2 className="mb-2 text-[9px] font-bold tracking-wider text-slate-500">
            {t.customer}
          </h2>
          {partyLines(data.customer).map((line, index) => (
            <p
              key={line}
              className={
                index === 0 ? "font-bold" : "text-[10px] text-slate-600"
              }
            >
              {line}
            </p>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
          <dt className="text-slate-500">{t.issue}</dt>
          <dd className="text-right font-medium">
            {formatDocumentDate(data.issueDate, data.language)}
          </dd>
          <dt className="font-bold" style={{ color: accent }}>
            {t.due}
          </dt>
          <dd className="text-right font-bold" style={{ color: accent }}>
            {formatDocumentDate(data.dueDate, data.language)}
          </dd>
          <dt className="text-slate-500">{t.service}</dt>
          <dd className="text-right">
            {formatDocumentDate(data.serviceDate, data.language)}
          </dd>
          {data.issuePlace && (
            <>
              <dt className="text-slate-500">Mjesto</dt>
              <dd className="text-right">{data.issuePlace}</dd>
            </>
          )}
          {data.customerOrderNumber && (
            <>
              <dt className="text-slate-500">Narudžbenica</dt>
              <dd className="text-right">{data.customerOrderNumber}</dd>
            </>
          )}
        </dl>
      </section>
      <div className="flex-1">
        {data.groups
          .filter((g) => g.visible)
          .map((group) => (
            <section key={group.id} className="mb-4 break-inside-avoid-page">
              <h3
                className="border-b py-1 text-xs font-bold"
                style={{ color: accent }}
              >
                {group.name}
              </h3>
              <table className="w-full table-fixed border-collapse text-[9px]">
                <thead className="table-header-group">
                  <tr
                    style={{ backgroundColor: accent }}
                    className="text-white"
                  >
                    <th className="w-7 p-1.5 text-left">#</th>
                    <th className="p-1.5 text-left">{t.item}</th>
                    <th className="w-12 p-1.5 text-right">{t.qty}</th>
                    <th className="w-10 p-1.5 text-left">{t.unit}</th>
                    {data.showFinancials !== false && (
                      <>
                        <th className="w-16 p-1.5 text-right">{t.price}</th>
                        <th className="w-12 p-1.5 text-right">{t.discount}</th>
                        <th className="w-10 p-1.5 text-right">{t.tax}</th>
                        <th className="w-20 p-1.5 text-right">{t.amount}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.items
                    .filter((i) => i.visible)
                    .map((item, index) => {
                      const value = calculateInvoiceItem(
                        item,
                        group.discountRate,
                        data.globalDiscountRate,
                        data.taxMode,
                      );
                      return (
                        <tr key={item.id} className="border-b align-top">
                          <td className="p-1.5 text-slate-500">{index + 1}</td>
                          <td className="p-1.5">
                            <strong>
                              {item.code && `${item.code} · `}
                              {item.name}
                            </strong>
                            {item.description && (
                              <p className="mt-0.5 text-[8px] leading-tight text-slate-500">
                                {item.description}
                              </p>
                            )}
                            {item.note && (
                              <p className="mt-1 italic text-slate-500">
                                {item.note}
                              </p>
                            )}
                          </td>
                          <td className="p-1.5 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="p-1.5">{item.unit}</td>
                          {data.showFinancials !== false && (
                            <>
                              <td className="p-1.5 text-right tabular-nums">{money(Math.round(item.unitPrice * 100), data)}</td>
                              <td className="p-1.5 text-right">{item.discountRate}%</td>
                              <td className="p-1.5 text-right">{data.taxMode === "standard" || data.taxMode === "prilagođeno" ? `${item.taxRate}%` : "—"}</td>
                              <td className="p-1.5 text-right font-medium tabular-nums">{money(value.totalCents, data)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>
          ))}
        {data.showFinancials !== false && <section className="ml-auto mt-4 w-[48%] break-inside-avoid rounded-lg border p-3 text-[10px]">
          <div className="flex justify-between">
            <span>Bruto vrijednost</span>
            <span>{money(summary.grossCents, data)}</span>
          </div>
          <div className="flex justify-between">
            <span>Popust</span>
            <span>− {money(summary.discountCents, data)}</span>
          </div>
          {data.charges
            .filter((c) => c.includedInCalculation)
            .map((c) => (
              <div
                key={c.id}
                className={!c.visible ? "hidden" : "flex justify-between"}
              >
                <span>{c.name}</span>
                <span>{money(Math.round(c.amount * 100), data)}</span>
              </div>
            ))}
          <div className="flex justify-between border-t pt-1">
            <span>{t.subtotal}</span>
            <span>{money(summary.netCents, data)}</span>
          </div>
          {Object.entries(summary.taxByRate).map(([rate, value]) => (
            <div key={rate} className="flex justify-between">
              <span>
                {t.tax} {rate}%
              </span>
              <span>{money(value.taxCents, data)}</span>
            </div>
          ))}
          {data.type === "završna" && data.previousAdvance > 0 && (
            <div className="flex justify-between">
              <span>Odbitak avansa</span>
              <span>
                − {money(Math.round(data.previousAdvance * 100), data)}
              </span>
            </div>
          )}
          <div
            className="mt-1 flex justify-between border-t pt-2 text-sm font-bold"
            style={{ color: accent }}
          >
            <span>{t.amount}</span>
            <span>{money(summary.totalCents, data)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.paid}</span>
            <span>{money(summary.paidCents, data)}</span>
          </div>
          <div
            className="mt-1 flex justify-between rounded p-1.5 text-sm font-black text-white"
            style={{ backgroundColor: accent }}
          >
            <span>{t.remaining}</span>
            <span>{money(summary.remainingCents, data)}</span>
          </div>
        </section>}
        {data.showLegalNote && data.legalNote && (
          <section
            className="mt-4 break-inside-avoid rounded border-l-4 bg-slate-50 p-3 text-[9px]"
            style={{ borderColor: accent }}
          >
            <strong>Porezna napomena</strong>
            <p className="mt-1 whitespace-pre-wrap">{data.legalNote}</p>
            <p className="mt-1 text-amber-700">
              Provjerite porezni i pravni tekst prije izdavanja fakture.
            </p>
          </section>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <section className="break-inside-avoid text-[9px]">
            <h3 className="font-bold">{t.payment}</h3>
            {[
              ["IBAN", data.payment.iban],
              ["SWIFT", data.payment.swift],
              ["Banka", data.payment.bankName],
              [
                "Model / poziv",
                [data.payment.model, data.payment.reference]
                  .filter(Boolean)
                  .join(" "),
              ],
              ["Opis", data.payment.description],
              ["Način", data.payment.method],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <p key={k}>
                  <span className="text-slate-500">{k}: </span>
                  {v}
                </p>
              ))}
            {data.payment.showCodePlaceholder && (
              <div className="mt-2 border border-dashed p-2 text-center text-slate-400">
                Mjesto za budući standardizirani 2D/QR kod plaćanja
              </div>
            )}
          </section>
          {data.payments.length > 0 && (
            <section className="break-inside-avoid text-[9px]">
              <h3 className="font-bold">{t.payments}</h3>
              {data.payments.map((p) => (
                <p key={p.id}>
                  {formatDocumentDate(p.date, data.language)} ·{" "}
                  {money(Math.round(p.amount * 100), data)} · {p.method}
                </p>
              ))}
            </section>
          )}
        </div>
        {data.note && (
          <section className="mt-3 text-[9px]">
            <strong>Napomena</strong>
            <p className="whitespace-pre-wrap">{data.note}</p>
          </section>
        )}
        {data.blocks
          .filter((b) => b.visible && !b.internal && b.content)
          .map((block) => (
            <section
              key={block.id}
              className="mt-3 break-inside-avoid text-[9px]"
            >
              <strong>{block.title}</strong>
              <p className="whitespace-pre-wrap">{block.content}</p>
            </section>
          ))}
        <section className="mt-8 grid grid-cols-2 gap-6 break-inside-avoid">
          {data.signatures
            .filter((s) => s.visible)
            .map((signature, index) => (
              <div
                key={signature.id}
                className="border-t pt-2 text-center text-[9px]"
              >
                <strong>{signature.title}</strong>
                <p className="mt-5">{signature.name}</p>
                <p className="text-slate-500">
                  {signature.role}{" "}
                  {formatDocumentDate(signature.date, data.language)}
                </p>
                {index === 0 && (
                  <div className="mt-2 flex justify-center gap-2">
                    {images?.signature && (
                      <Image
                        src={images.signature}
                        alt="Potpis"
                        width={90}
                        height={34}
                        unoptimized
                        className="max-h-9 object-contain"
                      />
                    )}
                    {images?.stamp && (
                      <Image
                        src={images.stamp}
                        alt="Pečat"
                        width={60}
                        height={45}
                        unoptimized
                        className="max-h-12 object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
        </section>
      </div>
      <footer className="mt-5 flex justify-between border-t pt-2 text-[8px] text-slate-500">
        <span>{data.company.name}</span>
        <span>{t.page} 1</span>
      </footer>
    </article>
  );
}
