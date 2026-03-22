import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repos = await prisma.repo.findMany({
    select: { owner: true, name: true, updatedAt: true },
    where: { archived: false },
    take: 1000,
    orderBy: { updatedAt: "desc" },
  }).catch(() => []);

  const repoUrls: MetadataRoute.Sitemap = repos.map((r) => ({
    url: `${APP_URL}/repo/${r.owner}/${r.name}`,
    lastModified: r.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${APP_URL}/digest`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/topics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/languages`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
...repoUrls,
  ];
}
