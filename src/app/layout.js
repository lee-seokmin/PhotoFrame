import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "사진 프레임",
  description: "사진의 메타 데이터로 프레임 만들기",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-6JMVQ3802C"></Script>
        <Script id='google-analytics'>
          {`
                window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6JMVQ3802C');       
          `}
        </Script>
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
