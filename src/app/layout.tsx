// PERFORMANCE: layout.tsx é Server Component por padrão (sem "use client")
// Isso garante que o HTML inicial seja gerado no servidor, reduzindo o JS enviado ao cliente.
// A fonte é carregada via next/font para evitar layout shift (CLS = 0)

import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

// PERFORMANCE: next/font faz o download da fonte em build time e serve via self-hosting,
// eliminando requests externos e evitando FOUT (Flash of Unstyled Text)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap", // Garante que o texto fique visível enquanto a fonte carrega
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CloudTerm — Monitor de Ativos",
  description: "Terminal de monitoramento de microsserviços e infraestrutura cloud",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${jetbrainsMono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
