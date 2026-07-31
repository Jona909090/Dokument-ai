export default function DashboardLoading() {
  return <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-7 sm:px-7 lg:px-9" aria-label="Učitavanje dashboarda" aria-busy="true"><div className="skeleton h-48 rounded-3xl" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-32 rounded-2xl" />)}</div><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-52 rounded-2xl" />)}</div></main>;
}
