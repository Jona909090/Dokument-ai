import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LandingPage } from "@/components/landing/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokument AI – Profesionalni dokumenti uz AI pomoć",
  description: "Opišite što vam treba, odaberite profesionalan obrazac, uredite sadržaj i preuzmite dokument u PDF ili Word formatu.",
  alternates: { canonical: "/" },
  openGraph: { title: "Dokument AI – Profesionalni dokumenti uz AI pomoć", description: "Od opisa do profesionalnog PDF ili Word dokumenta.", type: "website", locale: "hr_HR" },
  twitter: { card: "summary", title: "Dokument AI – Profesionalni dokumenti uz AI pomoć", description: "Opišite dokument, uredite ga i preuzmite u PDF ili Word formatu." },
};

export default function Home() {
  return (
    <>
      <Header />
      <main><LandingPage /></main>
      <Footer />
    </>
  );
}
