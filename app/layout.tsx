import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "MusicStation",
  description: "A local-first music library and player.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/assets/brand-logo.png?v=musicstation", type: "image/png" }],
    shortcut: ["/assets/brand-logo.png?v=musicstation"],
    apple: "/assets/brand-logo.png?v=musicstation",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MusicStation" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050505", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Michroma&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/src/styles.css?v=20260816-203101" />
        <link rel="stylesheet" href="/src/stability.css?v=20260816-2125" />
        <link rel="stylesheet" href="/src/ui-modern.css?v=20260816-204025" />
          <link rel="stylesheet" href="/src/final-fixes.css?v=20260816-221856" />
    <link rel="stylesheet" href="/src/graphite-theme.css?v=20260816-223421" />
</head>
      <body className="launch-active">{children}</body>
    </html>
  );
}




