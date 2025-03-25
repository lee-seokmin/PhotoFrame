import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "@/lib/GoogleAnalytics";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 기본 URL 설정
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "PhotoFrame",
  description: "Automatic Metadata Extraction",
  icons: {
    icon: "/logo/favicon.ico",
  },
  openGraph: {
    title: "PhotoFrame",
    description: "Automatic Metadata Extraction",
    url: baseUrl,
    siteName: "PhotoFrame",
    type: "website",
    locale: "ko",
  },
  // RSS 피드 및 기타 메타데이터 링크 추가
  alternates: {
    types: {
      'application/rss+xml': `${baseUrl}/rss.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="naver-site-verification" content="8ddc70165e65fd0022da30ea88fa759c96abde94" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen h-full`}
      >
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        ) : null}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
