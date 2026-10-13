import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { FullPageSpinner } from "../ui/Spinner";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-indigo-700">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="container-page flex-1 py-8">
        {/* Suspense shows the fallback while a lazy-loaded page downloads */}
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
