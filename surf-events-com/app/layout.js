import "./globals.css";

const SITE_URL = "https://surf-events.com";
const TITLE = "Surf Events – surf contests, festivals & meetups worldwide";
const DESCRIPTION =
  "Surf contests, festivals and meetups worldwide, in one list. See who is going, curated by the Surfmate community.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Surf Events",
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
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#73c9eb" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="icon" href="/assets/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
