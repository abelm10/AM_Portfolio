import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

// One public page. /admin is deliberately left out.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getSite().url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
