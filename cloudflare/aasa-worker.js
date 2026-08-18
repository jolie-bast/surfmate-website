/**
 * Cloudflare Worker for GitHub Pages.
 *
 * GitHub Pages serves extensionless files as application/octet-stream.
 * Apple Universal Links need this path as application/json, without a redirect.
 *
 * Route in Cloudflare:
 *   surfmate.eu/.well-known/apple-app-site-association
 */
export default {
  async fetch(request) {
    const originResponse = await fetch(request);
    const body = await originResponse.arrayBuffer();

    return new Response(body, {
      status: originResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};
