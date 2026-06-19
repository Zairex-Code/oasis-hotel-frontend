import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 🚀 Importamos el proveedor global de autenticación y tema
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Oasis Hotel - Premium Hospitality Evasion",
  description: "Experience luxury and comfort across our worldwide network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning evita avisos molestos de Next.js por los cambios de clases de modo oscuro
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {/* 🚀 Envolvemos TODA la aplicación aquí una sola vez */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}