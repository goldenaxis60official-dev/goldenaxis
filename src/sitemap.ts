//src>sitemap.ts

import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://goldenaxis60.company",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://goldenaxis60.company/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // We can add privacy policy or other public routes here later
  ];
}