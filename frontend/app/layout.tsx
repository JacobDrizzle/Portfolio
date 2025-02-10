import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "./components/Navbar";
import MatrixBackground from "./components/MatrixBackground";
import Footer from "./components/Footer/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DrDrizzle | Software Developer",
  description: "Full-stack software developer specializing in modern web technologies, AI and Blockchain. Check out my projects, technical blog, and development experience.",
  generator: "Next.js",
  applicationName: "DrDrizzles Portfolio",
  referrer: "origin-when-cross-origin",
  keywords: ["software developer", "full-stack", "web development", "React", "Next.js", "TypeScript", "portfolio"],
  authors: [{ name: "Jacob Dorrill" }],
  creator: "DrDrizzles",
  publisher: "DrDrizzles",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "DrDrizzles | Software Developer Portfolio",
    description: "Full-stack software developer specializing in modern web technologies, AI and Blockchain. Check out my projects, technical blog, and development experience.",
    url: "https://your-portfolio-url.com",
    siteName: "DrDrizzles Portfolio",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MatrixBackground />
        <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
