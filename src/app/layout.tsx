import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TechLab+ ACASA",
    template: "%s | TechLab+ ACASA",
  },
  description:
    "Sistema de gestão da ACASA para administração da associação e relacionamento com seus associados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
