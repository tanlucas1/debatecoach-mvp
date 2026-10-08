import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Sora } from "next/font/google";
import { DEFAULT_THEME } from "@/lib/theme/config";
import { themeInitScript } from "@/lib/theme/init-script";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Debate Coach", template: "%s · Debate Coach" },
  description:
    "Practise debating out loud against an AI opponent that argues from a real case file, then get feedback on your round.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scheme={DEFAULT_THEME.scheme}
      data-mode={DEFAULT_THEME.mode}
      className={`${sora.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
