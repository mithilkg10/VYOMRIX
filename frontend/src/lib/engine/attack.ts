// MITRE ATT&CK Enterprise tactics and the techniques this platform tracks.
// Techniques without a rule are listed on purpose so the coverage map shows real gaps.

export const TACTICS = [
  { id: "reconnaissance", name: "Reconnaissance", short: "TA0043" },
  { id: "resource-development", name: "Resource Development", short: "TA0042" },
  { id: "initial-access", name: "Initial Access", short: "TA0001" },
  { id: "execution", name: "Execution", short: "TA0002" },
  { id: "persistence", name: "Persistence", short: "TA0003" },
  { id: "privilege-escalation", name: "Privilege Escalation", short: "TA0004" },
  { id: "defense-evasion", name: "Defense Evasion", short: "TA0005" },
  { id: "credential-access", name: "Credential Access", short: "TA0006" },
  { id: "discovery", name: "Discovery", short: "TA0007" },
  { id: "lateral-movement", name: "Lateral Movement", short: "TA0008" },
  { id: "collection", name: "Collection", short: "TA0009" },
  { id: "command-and-control", name: "Command and Control", short: "TA0011" },
  { id: "exfiltration", name: "Exfiltration", short: "TA0010" },
  { id: "impact", name: "Impact", short: "TA0040" },
] as const;

export type TacticId = (typeof TACTICS)[number]["id"];

export const TECHNIQUES: { id: string; name: string; tactic: TacticId }[] = [
  { id: "T1595.002", name: "Vulnerability Scanning", tactic: "reconnaissance" },
  { id: "T1595.001", name: "Scanning IP Blocks", tactic: "reconnaissance" },
  { id: "T1589", name: "Gather Victim Identity Information", tactic: "reconnaissance" },
  { id: "T1583.001", name: "Acquire Infrastructure: Domains", tactic: "resource-development" },
  { id: "T1588.002", name: "Obtain Capabilities: Tool", tactic: "resource-development" },
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "initial-access" },
  { id: "T1190", name: "Exploit Public Facing Application", tactic: "initial-access" },
  { id: "T1133", name: "External Remote Services", tactic: "initial-access" },
  { id: "T1078", name: "Valid Accounts", tactic: "initial-access" },
  { id: "T1059.001", name: "PowerShell", tactic: "execution" },
  { id: "T1059.003", name: "Windows Command Shell", tactic: "execution" },
  { id: "T1059.004", name: "Unix Shell", tactic: "execution" },
  { id: "T1047", name: "Windows Management Instrumentation", tactic: "execution" },
  { id: "T1569.002", name: "Service Execution", tactic: "execution" },
  { id: "T1204.002", name: "User Execution: Malicious File", tactic: "execution" },
  { id: "T1053.005", name: "Scheduled Task", tactic: "persistence" },
  { id: "T1547.001", name: "Registry Run Keys", tactic: "persistence" },
  { id: "T1505.003", name: "Web Shell", tactic: "persistence" },
  { id: "T1136.001", name: "Create Local Account", tactic: "persistence" },
  { id: "T1543.003", name: "Windows Service", tactic: "privilege-escalation" },
  { id: "T1548.002", name: "Bypass User Account Control", tactic: "privilege-escalation" },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "privilege-escalation" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "defense-evasion" },
  { id: "T1562.001", name: "Disable or Modify Tools", tactic: "defense-evasion" },
  { id: "T1070.001", name: "Clear Windows Event Logs", tactic: "defense-evasion" },
  { id: "T1218.011", name: "Rundll32", tactic: "defense-evasion" },
  { id: "T1036.005", name: "Match Legitimate Name or Location", tactic: "defense-evasion" },
  { id: "T1003.001", name: "LSASS Memory", tactic: "credential-access" },
  { id: "T1110.001", name: "Password Guessing", tactic: "credential-access" },
  { id: "T1110.003", name: "Password Spraying", tactic: "credential-access" },
  { id: "T1558.003", name: "Kerberoasting", tactic: "credential-access" },
  { id: "T1087.002", name: "Domain Account Discovery", tactic: "discovery" },
  { id: "T1033", name: "System Owner/User Discovery", tactic: "discovery" },
  { id: "T1082", name: "System Information Discovery", tactic: "discovery" },
  { id: "T1018", name: "Remote System Discovery", tactic: "discovery" },
  { id: "T1021.002", name: "SMB/Windows Admin Shares", tactic: "lateral-movement" },
  { id: "T1021.004", name: "SSH", tactic: "lateral-movement" },
  { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "lateral-movement" },
  { id: "T1560.001", name: "Archive via Utility", tactic: "collection" },
  { id: "T1005", name: "Data from Local System", tactic: "collection" },
  { id: "T1071.001", name: "Web Protocols", tactic: "command-and-control" },
  { id: "T1071.004", name: "DNS", tactic: "command-and-control" },
  { id: "T1105", name: "Ingress Tool Transfer", tactic: "command-and-control" },
  { id: "T1571", name: "Non Standard Port", tactic: "command-and-control" },
  { id: "T1048.003", name: "Exfiltration Over Unencrypted Non C2 Protocol", tactic: "exfiltration" },
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "exfiltration" },
  { id: "T1490", name: "Inhibit System Recovery", tactic: "impact" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "impact" },
  { id: "T1496", name: "Resource Hijacking", tactic: "impact" },
];

export const techniqueName = (id: string) => TECHNIQUES.find((t) => t.id === id)?.name ?? id;
export const tacticName = (id: string) => TACTICS.find((t) => t.id === id)?.name ?? id;
export const techniqueTactic = (id: string) => TECHNIQUES.find((t) => t.id === id)?.tactic;
export const attackUrl = (id: string) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`;
