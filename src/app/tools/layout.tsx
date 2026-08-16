import Link from "next/link";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-end">
          <Link
            href="/tools/pdf-extra"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Dodatni PDF alati (9)
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
