import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/Navbar";
import MatrixBackground from "@/components/MatrixBackground";
import Footer from "@/components/Footer/Footer";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "ML engineer building production RAG systems, AI agents, and predictive models. Currently shipping ML features at CompuCal (Cork, Ireland).";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jacobdrizzle.dev"),
  title: {
    default: "Jacob Dorrill — ML Engineer",
    template: "%s | Jacob Dorrill — ML Engineer",
  },
  description: siteDescription,
  generator: "Next.js",
  applicationName: "Jacob Dorrill — ML Engineer",
  referrer: "origin-when-cross-origin",
  keywords: [
    "ML engineer",
    "machine learning",
    "RAG",
    "AI agents",
    "MCP",
    "LangChain",
    "CrewAI",
    "pgvector",
    "CatBoost",
    "XGBoost",
    "predictive models",
    "OCR",
    "Python",
    "FastAPI",
    "Cork Ireland",
  ],
  authors: [{ name: "Jacob Dorrill" }],
  creator: "Jacob Dorrill",
  publisher: "Jacob Dorrill",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Jacob Dorrill — ML Engineer",
    description: siteDescription,
    url: "https://www.jacobdrizzle.dev",
    siteName: "Jacob Dorrill — ML Engineer",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "https://www.jacobdrizzle.dev/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <MatrixBackground />
        <Navbar />
          {children}
          <Analytics />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
