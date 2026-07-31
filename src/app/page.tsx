import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return (
    <>
      <Header />
      <main><LandingPage /></main>
      <Footer />
    </>
  );
}
