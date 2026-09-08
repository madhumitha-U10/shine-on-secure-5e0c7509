import { createFileRoute } from "@tanstack/react-router";

const STATIC_PATHS = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/explore", priority: "0.9", changefreq: "daily" },
  { path: "/categories", priority: "0.8", changefreq: "weekly" },
  { path: "/featured", priority: "0.8", changefreq: "weekly" },
  { path: "/near-me", priority: "0.7", changefreq: "weekly" },
  { path: "/stories", priority: "0.6", changefreq: "weekly" },
  { path: "/seller/register", priority: "0.6", changefreq: "monthly" },
  { path: "/seller/login", priority: "0.3", changefreq: "monthly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const urls = STATIC_PATHS.map(
          ({ path, priority, changefreq }) => `  <url>
    <loc>${origin}${path === "/" ? "" : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
        ).join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
