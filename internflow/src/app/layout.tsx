import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "500", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "R-Choice | Rathinam College Internship & Placement Portal",
  description:
    "R-Choice is the official internship and placement management portal for Rathinam College. Build your professional profile, apply for opportunities, and track your placement journey.",
  keywords: [
    "Rathinam College",
    "Internship Portal",
    "Placement Portal",
    "R-Choice",
    "Student Profile",
    "ATS Resume",
  ],
  authors: [{ name: "Rathinam College" }],
  openGraph: {
    title: "R-Choice | Rathinam College",
    description: "Your gateway to internships and placements at Rathinam College",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#122B40",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
