import type { Metadata } from "next";
import "./globals.css";
import SessionRefresh from "@/app/session-refresh";
import { cookies } from "next/headers";
import { themeBootstrap } from "@/lib/theme";

export const metadata: Metadata = {
  title: "VisaFund",
  description: "Track genuine transactions, organize funding evidence, and plan your international education.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme=(await cookies()).get("visafund-theme")?.value;
  return (
    <html lang="en" className={theme==="dark"?"dark":undefined} suppressHydrationWarning>
      <head>
        <title>VisaFund</title>
        <meta name="google-site-verification" content="RUb4BeD1Iwr5BfO6swomXIhNq65QlHbxqvUo9ykBM9w" />
        <style dangerouslySetInnerHTML={{__html:"html,body{background:#f4f7fa}html.dark,html.dark body{background:#0f1b26;color-scheme:dark}"}}/>
        <script dangerouslySetInnerHTML={{__html:themeBootstrap}}/>
      </head>
      <body className="antialiased">{children}<SessionRefresh/></body>
    </html>
  );
}
