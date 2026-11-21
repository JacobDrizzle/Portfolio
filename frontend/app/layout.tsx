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

const siteTitle = "Jacob Dorrill — AI Safety & ML Engineer";

const siteDescription =
  "AI safety and ML engineer: AI agents with scoped tool access, evaluation, production ML and software security. Final year of a BSc (Hons) in Software Development at MTU Cork.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jacobdrizzle.dev"),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  generator: "Next.js",
  applicationName: siteTitle,
  referrer: "origin-when-cross-origin",
  keywords: [
    "AI safety",
    "AI evaluation",
    "AI agents",
    "ML engineer",
    "machine learning",
    "software security",
    "cybersecurity",
    "exploit mitigation",
    "MCP",
    "RAG",
    "LangChain",
    "pgvector",
    "CatBoost",
    "XGBoost",
    "PyTorch",
    "Python",
    "software engineering",
    "Software Development",
    "MTU Cork",
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
    title: siteTitle,
    description: siteDescription,
    url: "https://www.jacobdrizzle.dev",
    siteName: siteTitle,
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
