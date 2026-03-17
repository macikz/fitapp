import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FitApp",
  description: "Osobní fitness deník – trénink & makra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
          <main style={{ flex: 1 }}>{children}</main>
          <Nav />
        </div>
      </body>
    </html>
  );
}
