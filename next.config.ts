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
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Photos are prepared ahead of time, and uploads come from the admin area's own image service.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
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
