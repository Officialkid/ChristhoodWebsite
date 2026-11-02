import type { NextConfig } from "next";

/** Old page address -> new page address, so bookmarks and search results keep working. */
const oldPages: Record<string, string> = {
  "index.html": "/",
  "christhood.html": "/about",
  "mission.html": "/about/mission",
  "apostle.html": "/about/apostle-dennis",
  "leadership.html": "/about/leadership",
  "international-faith-chapel.html": "/ministries/international-faith-chapel",
  "worship.html": "/ministries/worship",
  "missions-outreach.html": "/ministries/missions",
  "Counselling.html": "/ministries/counselling",
  "counselling.html": "/ministries/counselling",
  "media.html": "/ministries/media",
  "men.html": "/ministries/mens",
  "ladies.html": "/ministries/ladies",
  "administration.html": "/ministries/administration",
  "protocol.html": "/ministries/protocol",
  "creative.html": "/ministries/creative",
  "jewels.html": "/programmes/jewels",
  "teen-life.html": "/programmes/teen-life",
  "branch.html": "/programmes/branch",
  "branch-registration.html": "/programmes/branch/register",
  "impact.html": "/programmes/impact",
  "iAct.html": "/programmes/iact",
  "iact.html": "/programmes/iact",
  "apologetics.html": "/programmes/apologetics",
  "humanitarian.html": "/humanitarian",
  "events.html": "/events",
  "campsregistration.html": "/events/register",
  "give.html": "/give",
  "visit.html": "/visit",
  "prayer.html": "/prayer",
};

/** The camps addresses: the Christhood one, and the old camp-site one until it forwards. Each opens the Camps page; every other page works under them too. */
const campsHosts = ["camp.christhoodministries.org", "camp.instituteofapologetics.org"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Photos are prepared ahead of time; pictures the team uploads may come from the photo host.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    const secure = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    // A test copy of the site (NOINDEX=1) is kept out of search results so it never competes with the real one.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers: secure },
      ...(process.env.NOINDEX === "1" ? [{ source: "/:path*", missing: campsHosts.map((value) => ({ type: "host" as const, value })), headers: noindex }] : []),
      {
        // The team area is never indexed, cached or shown inside another site.
        source: "/123admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }, { key: "X-Frame-Options", value: "DENY" }],
      },
      { source: "/123admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }, { key: "X-Frame-Options", value: "DENY" }] },
    ];
  },
  async rewrites() {
    return { beforeFiles: [...campsHosts.map((value) => ({ source: "/", has: [{ type: "host" as const, value }], destination: "/camps" }))] };
  },
  async redirects() {
    return Object.entries(oldPages).map(([from, to]) => ({
      source: `/${from}`,
      destination: to,
      permanent: true,
    }));
  },
};

export default nextConfig;
