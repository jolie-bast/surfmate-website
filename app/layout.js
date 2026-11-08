import "./globals.css";

export const metadata = {
  title: "Surfmate – Find surfers nearby.",
  description:
    "Surfmate connects surfers worldwide. See who surfs your spot, share spotchecks, join meetups – and turn strangers in the line-up into surf friends.",
  metadataBase: new URL("https://surfmate.eu"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
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
      <body>{children}</body>
    </html>
  );
}
