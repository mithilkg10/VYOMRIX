// Threat intelligence store. Indicators are synthetic and use the documentation address
// ranges from RFC 5737 (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) and the reserved
// .example domain, so nothing here points at a real system.

export type IocType = "ip" | "domain" | "sha256" | "url";

export interface Ioc {
  type: IocType;
  value: string;
  feed: string;
  threat: string;
  confidence: number;
  firstSeen: string;
  tags: string[];
}

export const FEEDS = [
  { id: "c2", name: "C2 infrastructure feed", kind: "IP and domain", refresh: "15 min", description: "Command and control servers for commodity loaders and post exploitation frameworks." },
  { id: "malurl", name: "Malicious URL feed", kind: "URL and domain", refresh: "30 min", description: "Payload staging and phishing URLs." },
  { id: "hash", name: "Malware hash feed", kind: "SHA 256", refresh: "1 hour", description: "Hashes of known malicious samples." },
  { id: "honeypot", name: "Internal honeypot sightings", kind: "IP", refresh: "Live", description: "Addresses seen attacking the VYOMRIX SSH honeypot. Fed back into detection automatically." },
] as const;

export const IOCS: Ioc[] = [
  { type: "ip", value: "192.0.2.44", feed: "C2 infrastructure feed", threat: "Cobalt Strike team server", confidence: 95, firstSeen: "2026-10-28", tags: ["c2", "cobaltstrike"] },
  { type: "domain", value: "update-cdn.example", feed: "C2 infrastructure feed", threat: "Loader staging domain", confidence: 90, firstSeen: "2026-10-29", tags: ["loader", "phishing"] },
  { type: "ip", value: "192.0.2.10", feed: "Malicious URL feed", threat: "Linux payload host", confidence: 85, firstSeen: "2026-11-02", tags: ["linux", "dropper"] },
  { type: "url", value: "http://192.0.2.10/k.sh", feed: "Malicious URL feed", threat: "Shell dropper", confidence: 85, firstSeen: "2026-11-02", tags: ["linux", "dropper"] },
  { type: "domain", value: "invoice-portal.example.net", feed: "Malicious URL feed", threat: "Invoice phishing lure", confidence: 80, firstSeen: "2026-10-27", tags: ["phishing"] },
  { type: "ip", value: "203.0.113.77", feed: "C2 infrastructure feed", threat: "Web exploitation scanner", confidence: 70, firstSeen: "2026-11-05", tags: ["scanner", "sqlmap"] },
  { type: "domain", value: "pool.minexmr.example", feed: "Malicious URL feed", threat: "Cryptomining pool", confidence: 75, firstSeen: "2026-09-30", tags: ["miner"] },
  { type: "sha256", value: "5f2b7c1e9a8d4b3f6e0c2a9d7b4e1f8c3a6d9b2e5f8c1a4d7b0e3f6a9c2d5b8e", feed: "Malware hash feed", threat: "Macro dropper (Q3_Invoice_4471.docm)", confidence: 92, firstSeen: "2026-10-29", tags: ["maldoc"] },
  { type: "sha256", value: "a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4", feed: "Malware hash feed", threat: "XMRig miner build", confidence: 88, firstSeen: "2026-09-30", tags: ["miner"] },
  { type: "ip", value: "198.51.100.66", feed: "Internal honeypot sightings", threat: "SSH brute forcing botnet node", confidence: 60, firstSeen: "2026-11-15", tags: ["bruteforce", "honeypot"] },
  { type: "ip", value: "198.51.100.91", feed: "Internal honeypot sightings", threat: "SSH brute forcing botnet node", confidence: 60, firstSeen: "2026-11-16", tags: ["bruteforce", "honeypot"] },
];

const byValue = new Map(IOCS.map((i) => [i.value.toLowerCase(), i]));

export function lookupIoc(value: string): Ioc | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  const direct = byValue.get(v);
  if (direct) return direct;
  // Domain suffix match, so sub.update-cdn.example still hits update-cdn.example.
  for (const ioc of IOCS) if (ioc.type === "domain" && v.endsWith("." + ioc.value)) return ioc;
  return undefined;
}

export function classifyIndicator(value: string): IocType | "unknown" {
  const v = value.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return "ip";
  if (/^[a-f0-9]{64}$/i.test(v)) return "sha256";
  if (/^https?:\/\//i.test(v)) return "url";
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v)) return "domain";
  return "unknown";
}
