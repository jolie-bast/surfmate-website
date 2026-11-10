import "./globals.css";
import JsonLd from "../components/JsonLd";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, siteGraph } from "../lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Surfmate",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Surfmate",
  authors: [{ name: "Jolie Bast", url: "/team.html" }],
  creator: "Jolie Bast",
  publisher: "Surfmate",
  category: "sports",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Surfmate",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/assets/favicon.ico",
    apple: "/images/app-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#73c9eb" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/assets/favicon.ico" />
        {/* Preload the display fonts used above the fold: without this, they
            swap in after first paint and reflow the page, so any #anchor the
            browser already scrolled to (e.g. #download) drifts out of view. */}
        <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/8/WOFF/8-Heavy.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff" href="/assets/fonts/Seattle/WOFF/SeattleRegular.woff" crossOrigin="anonymous" />
      </head>
      <body>
        <JsonLd data={siteGraph()} />
        {children}
      </body>
    </html>
  );
}
