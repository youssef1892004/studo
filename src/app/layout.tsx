// File path: src/app/layout.tsx
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const cairo = Cairo({ subsets: ["arabic"] });

// SEO Metadata Enhancement
export const metadata: Metadata = {
  title: {
    default: "Studio | تحويل النص إلى كلام عربي بالذكاء الاصطناعي",
    template: "%s | Studio",
  },
  description: "حوّل نصوصك العربية إلى أصوات طبيعية واحترافية باستخدام تقنية الذكاء الاصطناعي المتقدمة من Studio. مثالي لمنشئي المحتوى والتعليم والأعمال.",
  keywords: [
    'تحويل النص إلى كلام', 
    'TTS', 
    'Arabic TTS', 
    'نص إلى صوت', 
    'صوت عربي', 
    'studo', 
    'توليد صوت', 
    'ذكاء اصطناعي صوت', 
    'AI voice',
    'النطق العربي',
    'صوت احترافي'
  ],
  creator: 'Studo Team',
  publisher: 'Studo',
  openGraph: {
    title: 'Studo | تحويل النص إلى كلام عربي بالذكاء الاصطناعي',
    description: 'أصوات عربية طبيعية واحترافية لجميع احتياجاتك. جرب الآن!',
    url: 'https://www.voicestudio.space', // Replace with your actual domain
    siteName: 'Studo',
    images: [
      {
        url: '/og-image.png', // Make sure to create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studo | تحويل النص إلى كلام عربي بالذكاء الاصطناعي',
    description: 'حوّل نصوصك العربية إلى أصوات طبيعية واحترافية باستخدام تقنية الذكاء الاصطناعي المتقدمة من Studo.',
    images: ['/twitter-image.png'], // Make sure to create this image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};


const DynamicNavbar = dynamic(() => import('@/components/Navbar'), { 
    ssr: false,
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <ThemeProvider>
          <AuthProvider>
              <DynamicNavbar />
              {children}
          </AuthProvider>
        </ThemeProvider>
        <Script 
          src="https://cloud.umami.is/script.js" 
          data-website-id="b3c8b995-c0f2-4e86-b0ce-a937cda2e208" 
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Studo",
            "url": "https://www.voicestudio.space",
            "logo": "https://www.voicestudio.space/logo.png"
          }) }}
        />
      </body>
    </html>
  );
}
