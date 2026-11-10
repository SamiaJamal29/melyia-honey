import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/shop/"],
      disallow: [
        "/account",
        "/admin",
        "/cart",
        "/checkout",
        "/login",
        "/signup",
        "/reseller",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
