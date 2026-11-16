/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // This app lives in a subfolder of the surfmate-website monorepo, which
  // has its own lockfile; pin the tracing root so Next doesn't warn.
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
};

export default nextConfig;
