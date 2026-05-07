import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await supabase
          .from("seo_categories")
          .select("slug,updated_at")
          .eq("is_published", true)
          .order("sort_order");

        const cats = data ?? [];
        const today = new Date().toISOString().slice(0, 10);

        const urls = [
          { loc: `${SITE_URL}/`, lastmod: today, priority: "1.0", changefreq: "daily" },
          { loc: `${SITE_URL}/deals`, lastmod: today, priority: "0.9", changefreq: "daily" },
          ...cats.map((c) => ({
            loc: `${SITE_URL}/deals/${c.slug}`,
            lastmod: (c.updated_at ?? today).slice(0, 10),
            priority: "0.8",
            changefreq: "daily",
          })),
        ];

        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls
            .map(
              (u) =>
                `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod>` +
                `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
            )
            .join("\n") +
          `\n</urlset>\n`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
