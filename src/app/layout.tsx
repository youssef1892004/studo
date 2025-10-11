// File path: src/app/layout.tsx
import MobileBlocker from '@/components/MobileBlocker';
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import ClientLayout from '@/components/ClientLayout';


const cairo = Cairo({ subsets: ["arabic"] });

// SEO Metadata Enhancement
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: "AI Voice Studio | تحويل النص إلى كلام عربي بالذكاء الاصطناعي",
    template: "%s | AI Voice Studio",
  },
  description: "حوّل نصوصك العربية إلى أصوات طبيعية واحترافية باستخدام تقنية الذكاء الاصطناعي المتقدمة من AI Voice Studio. مثالي لمنشئي المحتوى والتعليم والأعمال.",
  keywords: [
    'تحويل النص إلى كلام', 
    'TTS', 
    'Arabic TTS', 
    'نص إلى صوت', 
    'صوت عربي', 
    'ai voice studio', 
    'توليد صوت', 
    'ذكاء اصطناعي صوت', 
    'AI voice',
    'النطق العربي',
    'صوت احترافي'
  ],
  creator: 'AI Voice Studio Team',
  publisher: 'AI Voice Studio',
  openGraph: {
    title: 'AI Voice Studio | تحويل النص إلى كلام عربي بالذكاء الاصطناعي',
    description: 'أصوات عربية طبيعية واحترافية لجميع احتياجاتك. جرب الآن!',
    url: 'https://www.voicestudio.space', // Replace with your actual domain
    siteName: 'AI Voice Studio',
    images: [
      {
        url: '/logos/logo.png', // Make sure to create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Voice Studio | تحويل النص إلى كلام عربي بالذكاء الاصطناعي',
    description: 'حوّل نصوصك العربية إلى أصوات طبيعية واحترافية باستخدام تقنية الذكاء الاصطناعي المتقدمة من AI Voice Studio.',
    images: ['/logos/logo.png'], // Make sure to create this image
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
    icon: '/logos/logo.png',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <MobileBlocker />
        <ClientLayout>
          {children}
        </ClientLayout>
        {/* Umami Analytics */}
        <Script 
          src="https://cloud.umami.is/script.js" 
          data-website-id="b3c8b995-c0f2-4e86-b0ce-a937cda2e208" 
          strategy="afterInteractive"
        />
        {/* Schema Markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AI Voice Studio",
            "url": "https://www.voicestudio.space",
            "logo": "https://www.voicestudio.space/logos/logo.png"
          }) }}
        />
      </body>
    </html>
  );
}