/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // The public submit flow is a Next page. The partner wizard stays the
  // existing static page; Next dev does not serve public/index.html for a
  // directory URL, so this rewrite keeps /events/submit/partner/ working.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/events/submit/partner/",
          destination: "/events/submit/partner/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
