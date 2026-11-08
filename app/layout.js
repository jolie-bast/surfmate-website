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
      </head>
      <body>{children}</body>
    </html>
  );
}
