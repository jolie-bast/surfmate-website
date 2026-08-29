/**
 * Cloudflare Worker for surfmate.eu (GitHub Pages origin).
 *
 * GitHub Pages ignores `_redirects`, so `/c/:slug` and `/p/:slug` would 404.
 * This worker soft-rewrites those paths to the landing pages (HTTP 200, URL stays).
 * It also forces the AASA file to `application/json` for Universal Links.
 *
 * Dashboard setup:
 * 1. Workers & Pages → Create Worker → paste this file
 * 2. Add routes (or one `surfmate.eu/*`):
 *      surfmate.eu/c/*
 *      surfmate.eu/p/*
 *      surfmate.eu/.well-known/apple-app-site-association
 *      surfmate.eu/apple-app-site-association
 *
 * Prefer Transform Rules instead of a Worker? Add two URL Rewrites:
 *   Path matches ^/c/[^/]+/?$  →  rewrite to /c/index.html
 *   Path matches ^/p/[^/]+/?$  →  rewrite to /p/index.html
 */

const INTERNAL_HEADER = "X-Surfmate-Internal";

function isAasaPath(pathname) {
  return (
    pathname === "/.well-known/apple-app-site-association" ||
    pathname === "/apple-app-site-association"
  );
}

function referralRewritePath(pathname) {
  const creator = pathname.match(/^\/c\/([^/]+)\/?$/);
  if (creator && creator[1] && creator[1] !== "index.html") {
    return "/c/index.html";
  }

  const partner = pathname.match(/^\/p\/([^/]+)\/?$/);
  if (partner && partner[1] && partner[1] !== "index.html") {
    return "/p/index.html";
  }

  return null;
}

export default {
  async fetch(request) {
    if (request.headers.get(INTERNAL_HEADER) === "1") {
      return fetch(request);
    }

    const url = new URL(request.url);

    if (isAasaPath(url.pathname)) {
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
    }

    const rewritePath = referralRewritePath(url.pathname);
    if (rewritePath) {
      const rewriteUrl = new URL(request.url);
      rewriteUrl.pathname = rewritePath;

      const headers = new Headers(request.headers);
      headers.set(INTERNAL_HEADER, "1");

      return fetch(
        new Request(rewriteUrl.toString(), {
          method: request.method,
          headers,
          redirect: "follow",
          body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
        }),
      );
    }

    return fetch(request);
  },
};
