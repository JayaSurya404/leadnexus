import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "LeadNexus", short_name: "LeadNexus", start_url: "/", display: "standalone" }; }
