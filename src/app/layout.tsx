// File path: src/app/layout.tsx
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar"; // --- إعادة استيراد Navbar ---

const cairo = Cairo({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Studo - Arabic TTS",
  description: "Generate Arabic speech from text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <AuthProvider>
            <Navbar /> {/* --- === إعادة تفعيل شريط التنقل === --- */}
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}