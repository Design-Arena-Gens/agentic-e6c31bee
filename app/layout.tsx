import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cricket Scoreboard",
  description: "Live scores and results for cricket matches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <div className="container-max py-6">
          <header className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cricket Scoreboard</h1>
            <ThemeToggle />
          </header>
          {children}
          <footer className="mt-10 text-xs text-slate-500">Data is sample/mock for demo. Refreshes every 15s.</footer>
        </div>
      </body>
    </html>
  );
}

function ThemeToggle() {
  return (
    <button
      className="btn"
      onClick={() => {
        if (typeof document === "undefined") return;
        document.documentElement.classList.toggle("dark");
      }}
    >
      Toggle theme
    </button>
  );
}
