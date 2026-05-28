import type { ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* pb-16 lg:pb-0 reserves room for the fixed mobile bottom nav so
          page content never gets hidden behind it. */}
      <main id="main" className="flex-1 pb-16 lg:pb-0" role="main">
        {children}
      </main>
      <Footer />
      <MobileBottomNav active="home" />
    </div>
  );
}
