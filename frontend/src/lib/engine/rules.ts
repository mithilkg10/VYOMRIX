// Detection content. Every rule is plain Sigma YAML and is compiled by ./sigma.ts at
// runtime, so the rule text shown in the console is exactly what the engine executes.
// The same files are exported to detection_content/sigma for the Python test suite.

const R = String.raw;

export const RULE_SOURCES: string[] = [
R`title: Office Application Spawning a Script Interpreter
id: 6f1e1c39-91a1-4b44-9d8e-0c1f6a3c2a01
name: office_spawn_shell
status: stable
description: Detects Word, Excel or Outlook starting PowerShell, cmd, wscript, mshta or rundll32, a common pattern when a macro document runs its first stage.
author: Mithil K Gowda
date: 2026/10/02
logsource:
  product: windows
  category: process_creation
detection:
  selection_parent:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
      - '\POWERPNT.EXE'
      - '\OUTLOOK.EXE'
  selection_child:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\cmd.exe'
      - '\wscript.exe'
      - '\cscript.exe'
      - '\mshta.exe'
      - '\rundll32.exe'
  condition: selection_parent and selection_child
falsepositives:
  - Rare business macros that call scripts; review the document origin
level: high
tags:
  - attack.initial-access
  - attack.execution
  - attack.t1566.001
  - attack.t1204.002
`,
R`title: PowerShell Encoded Command
id: 2c9a7e10-5d0e-4c5a-8f41-1b7b0d6c2a02
name: ps_encoded_command
status: stable
description: PowerShell started with an encoded command line argument. Attackers use it to hide the script from simple command line logging.
author: Mithil K Gowda
date: 2026/10/02
logsource:
  product: windows
  category: process_creation
detection:
  selection_img:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
  selection_flag:
    CommandLine|windash|contains:
      - ' -enc '
      - ' -encodedcommand '
      - ' -ec '
      - ' -e '
  filter_sccm:
    ParentImage|endswith: '\CcmExec.exe'
  condition: all of selection_* and not filter_sccm
falsepositives:
  - Configuration management agents; the SCCM client is filtered
level: high
tags:
  - attack.execution
  - attack.defense-evasion
  - attack.t1059.001
  - attack.t1027
`,
R`title: Encoded PowerShell Download Cradle
id: 8b44f0a2-77de-4e0d-9b1c-3a5f2d9e4a03
name: ps_encoded_cradle
status: stable
description: Decodes nothing at runtime. Instead it searches the base64 command line for the UTF16 encoded forms of IEX and WebClient download calls at every byte offset.
author: Mithil K Gowda
date: 2026/10/04
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|wide|base64offset|contains:
      - 'IEX'
      - 'Invoke-Expression'
      - 'DownloadString'
      - 'Net.WebClient'
      - 'Invoke-WebRequest'
  condition: selection
falsepositives:
  - Unlikely
level: critical
tags:
  - attack.command-and-control
  - attack.execution
  - attack.t1105
  - attack.t1059.001
`,
R`title: PowerShell Network Connection on Non Standard Port
id: 1d3e4f5a-2b6c-4d7e-8f90-a1b2c3d4ea04
name: ps_nonstandard_port
status: test
description: PowerShell opening an outbound connection to a public address on a port other than 80 or 443.
author: Mithil K Gowda
date: 2026/10/04
logsource:
  product: windows
  category: network_connection
detection:
  selection:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
    Initiated: 'true'
  filter_ports:
    DestinationPort:
      - 80
      - 443
  filter_private:
    DestinationIp|cidr:
      - '10.0.0.0/8'
      - '172.16.0.0/12'
      - '192.168.0.0/16'
  condition: selection and not filter_ports and not filter_private
falsepositives:
  - Admin scripts that talk to internal tooling on custom ports
level: high
tags:
  - attack.command-and-control
  - attack.t1571
  - attack.t1071.001
`,
R`title: LSASS Memory Dump via Comsvcs MiniDump
id: 4a5b6c7d-8e9f-4a0b-9c1d-2e3f4a5b6c05
name: lsass_comsvcs_dump
status: stable
description: rundll32 calling the MiniDump export of comsvcs.dll, a living off the land way to dump LSASS memory for offline credential extraction.
author: Mithil K Gowda
date: 2026/10/05
logsource:
  product: windows
  category: process_creation
detection:
  selection_img:
    Image|endswith: '\rundll32.exe'
  selection_cli:
    CommandLine|contains|all:
      - 'comsvcs'
      - 'minidump'
  condition: all of selection_*
falsepositives:
  - None known
level: critical
tags:
  - attack.credential-access
  - attack.defense-evasion
  - attack.t1003.001
  - attack.t1218.011
`,
R`title: Suspicious LSASS Process Access
id: 7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e06
name: lsass_access
status: stable
description: A process opened LSASS with an access mask that allows reading its memory.
author: Mithil K Gowda
date: 2026/10/05
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
    GrantedAccess:
      - '0x1010'
      - '0x1410'
      - '0x1438'
      - '0x143a'
      - '0x1fffff'
  filter_av:
    SourceImage|endswith:
      - '\MsMpEng.exe'
      - '\wininit.exe'
  condition: selection and not filter_av
falsepositives:
  - EDR and backup agents that are not on the filter list
level: high
tags:
  - attack.credential-access
  - attack.t1003.001
`,
R`title: Domain Discovery Commands
id: 0e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a07
name: domain_discovery
status: stable
description: Enumeration of domain groups, users and controllers with net and nltest.
author: Mithil K Gowda
date: 2026/10/06
logsource:
  product: windows
  category: process_creation
detection:
  selection_net:
    Image|endswith:
      - '\net.exe'
      - '\net1.exe'
    CommandLine|contains:
      - ' group '
      - ' user '
    CommandLine|contains|all:
      - '/domain'
  selection_nltest:
    Image|endswith: '\nltest.exe'
    CommandLine|contains:
      - '/dclist'
      - '/domain_trusts'
  condition: 1 of selection_*
falsepositives:
  - Helpdesk staff checking group membership
level: medium
tags:
  - attack.discovery
  - attack.t1087.002
`,
R`title: PsExec Service Installation
id: 3b4c5d6e-7f80-4a91-8b2c-3d4e5f6a7b08
name: psexec_service
status: stable
description: The PSEXESVC service was installed, which is what Sysinternals PsExec and many clones do on the target of remote execution.
author: Mithil K Gowda
date: 2026/10/06
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID: 7045
    ServiceName|contains: 'PSEXESVC'
  condition: selection
falsepositives:
  - Administrators using PsExec for maintenance
level: high
tags:
  - attack.execution
  - attack.lateral-movement
  - attack.t1569.002
  - attack.t1543.003
`,
R`title: Remote Admin Share Access
id: 9a0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c09
name: admin_share_access
status: test
description: A network logon accessed the ADMIN$ or C$ share from another workstation.
author: Mithil K Gowda
date: 2026/10/06
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 5140
    ShareName|endswith:
      - '\ADMIN$'
      - '\C$'
  filter_machine:
    SubjectUserName|endswith: '$'
  condition: selection and not filter_machine
falsepositives:
  - Software deployment tools
level: high
tags:
  - attack.lateral-movement
  - attack.t1021.002
`,
R`title: Scheduled Task Created from the Command Line
id: 5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a10
name: schtasks_create
status: stable
description: schtasks.exe used to create a task.
author: Mithil K Gowda
date: 2026/10/07
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\schtasks.exe'
    CommandLine|windash|contains: ' -create '
  filter_office:
    CommandLine|contains: '\Microsoft\Office\'
  condition: selection and not filter_office
falsepositives:
  - Software installers
level: medium
tags:
  - attack.persistence
  - attack.execution
  - attack.t1053.005
`,
R`title: Defender Real Time Protection Disabled via PowerShell
id: 6f7a8b9c-0d1e-4f2a-8b3c-4d5e6f7a8b11
name: defender_tamper
status: stable
description: Set-MpPreference used to switch off real time monitoring or add broad exclusions.
author: Mithil K Gowda
date: 2026/10/07
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - 'DisableRealtimeMonitoring $true'
      - 'DisableRealtimeMonitoring 1'
      - 'Add-MpPreference -ExclusionPath C:\'
  condition: selection
falsepositives:
  - Troubleshooting by administrators
level: high
tags:
  - attack.defense-evasion
  - attack.t1562.001
`,
R`title: Shadow Copy Deletion
id: 7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c12
name: shadow_copy_delete
status: stable
description: Volume shadow copies removed with vssadmin or wmic, almost always seen right before ransomware encryption.
author: Mithil K Gowda
date: 2026/10/08
logsource:
  product: windows
  category: process_creation
detection:
  selection_vss:
    Image|endswith: '\vssadmin.exe'
    CommandLine|contains|all:
      - 'delete'
      - 'shadows'
  selection_wmic:
    Image|endswith: '\WMIC.exe'
    CommandLine|contains|all:
      - 'shadowcopy'
      - 'delete'
  condition: 1 of selection_*
falsepositives:
  - None expected on servers
level: critical
tags:
  - attack.impact
  - attack.t1490
`,
R`title: Windows Event Log Cleared
id: 8b9c0d1e-2f3a-4b4c-8d5e-6f7a8b9c0d13
name: eventlog_cleared
status: stable
description: The Security log was cleared, either seen as event 1102 or as wevtutil cl on the command line.
author: Mithil K Gowda
date: 2026/10/08
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\wevtutil.exe'
    CommandLine|contains:
      - ' cl '
      - ' clear-log '
  condition: selection
falsepositives:
  - Lab rebuilds
level: high
tags:
  - attack.defense-evasion
  - attack.t1070.001
`,
R`title: Registry Run Key Persistence via reg.exe
id: 9c0d1e2f-3a4b-4c5d-8e6f-7a8b9c0d1e14
name: run_key_persistence
status: stable
description: A value added under a Run or RunOnce key from the command line.
author: Mithil K Gowda
date: 2026/10/08
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\reg.exe'
    CommandLine|contains|all:
      - ' add '
      - '\CurrentVersion\Run'
  condition: selection
falsepositives:
  - Legitimate installers
level: medium
tags:
  - attack.persistence
  - attack.t1547.001
`,
R`title: Failed Windows Logon
id: 0d1e2f3a-4b5c-4d6e-8f7a-8b9c0d1e2f15
name: win_failed_logon
status: stable
description: Building block for the brute force correlations. On its own it does not raise alerts.
author: Mithil K Gowda
date: 2026/10/09
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4625
  condition: selection
level: low
tags:
  - attack.credential-access
  - attack.t1110.001
`,
R`title: Successful Network Logon
id: 1e2f3a4b-5c6d-4e7f-8a8b-9c0d1e2f3a16
name: win_network_logon
status: stable
description: Building block. A network or remote interactive logon succeeded.
author: Mithil K Gowda
date: 2026/10/09
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4624
    LogonType:
      - 3
      - 10
  condition: selection
level: informational
tags:
  - attack.initial-access
  - attack.t1078
`,
R`title: Windows Logon Brute Force
id: 2f3a4b5c-6d7e-4f8a-8b9c-0d1e2f3a4b17
name: win_bruteforce
status: stable
description: Ten or more failed logons from one source address within five minutes.
author: Mithil K Gowda
date: 2026/10/09
correlation:
  type: event_count
  rules:
    - win_failed_logon
  group-by:
    - IpAddress
  timespan: 5m
  condition:
    gte: 10
level: high
tags:
  - attack.credential-access
  - attack.t1110.001
`,
R`title: Password Spraying Against Windows Accounts
id: 3a4b5c6d-7e8f-4a9b-8c0d-1e2f3a4b5c18
name: win_password_spray
status: stable
description: One source address failing logons for six or more different accounts within ten minutes.
author: Mithil K Gowda
date: 2026/10/09
correlation:
  type: value_count
  rules:
    - win_failed_logon
  group-by:
    - IpAddress
  timespan: 10m
  condition:
    field: TargetUserName
    gte: 6
level: high
tags:
  - attack.credential-access
  - attack.t1110.003
`,
R`title: Windows Brute Force Followed by Successful Logon
id: 4b5c6d7e-8f9a-4b0c-8d1e-2f3a4b5c6d19
name: win_bruteforce_success
status: stable
description: A brute force burst and then a successful network logon from the same address within fifteen minutes. Treat the account as compromised.
author: Mithil K Gowda
date: 2026/10/09
correlation:
  type: temporal_ordered
  rules:
    - win_bruteforce
    - win_network_logon
  group-by:
    - IpAddress
  timespan: 15m
level: critical
tags:
  - attack.initial-access
  - attack.credential-access
  - attack.t1078
  - attack.t1110.001
`,
R`title: Local User Account Created
id: 5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e20
name: local_user_created
status: stable
description: A new local account was created (event 4720).
author: Mithil K Gowda
date: 2026/10/10
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4720
  condition: selection
falsepositives:
  - New starters provisioned by IT
level: medium
tags:
  - attack.persistence
  - attack.t1136.001
`,
R`title: SSH Failed Password
id: 6d7e8f9a-0b1c-4d2e-8f3a-4b5c6d7e8f21
name: ssh_failed
status: stable
description: Building block for SSH brute force correlation.
author: Mithil K Gowda
date: 2026/10/11
logsource:
  product: linux
  service: sshd
detection:
  selection:
    Event:
      - 'failed_password'
      - 'invalid_user'
  condition: selection
level: low
tags:
  - attack.credential-access
  - attack.t1110.001
`,
R`title: SSH Accepted Password Logon
id: 7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a22
name: ssh_accepted_password
status: stable
description: Building block. Password based SSH logon accepted.
author: Mithil K Gowda
date: 2026/10/11
logsource:
  product: linux
  service: sshd
detection:
  selection:
    Event: 'accepted_password'
  condition: selection
level: informational
tags:
  - attack.initial-access
  - attack.t1078
`,
R`title: SSH Brute Force
id: 8f9a0b1c-2d3e-4f4a-8b5c-6d7e8f9a0b23
name: ssh_bruteforce
status: stable
description: Fifteen or more failed SSH authentications from one address in five minutes against a production host.
author: Mithil K Gowda
date: 2026/10/11
correlation:
  type: event_count
  rules:
    - ssh_failed
  group-by:
    - SourceIp
    - Computer
  timespan: 5m
  condition:
    gte: 15
level: high
tags:
  - attack.credential-access
  - attack.t1110.001
`,
R`title: SSH Brute Force Followed by Successful Password Logon
id: 9a0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c24
name: ssh_bruteforce_success
status: stable
description: An SSH brute force burst and a successful password logon from the same address within ten minutes.
author: Mithil K Gowda
date: 2026/10/11
correlation:
  type: temporal_ordered
  rules:
    - ssh_bruteforce
    - ssh_accepted_password
  group-by:
    - SourceIp
  timespan: 10m
level: critical
tags:
  - attack.initial-access
  - attack.t1078
  - attack.t1133
`,
R`title: Web Server Process Spawning a Shell
id: 0b1c2d3e-4f5a-4b6c-8d7e-8f9a0b1c2d25
name: webserver_shell
status: stable
description: nginx, Apache or PHP FPM starting sh or bash. Strong sign of a web shell or remote code execution.
author: Mithil K Gowda
date: 2026/10/12
logsource:
  product: linux
  category: process_creation
detection:
  selection:
    ParentImage|endswith:
      - '/php-fpm'
      - '/php-fpm8.2'
      - '/nginx'
      - '/apache2'
      - '/httpd'
    Image|endswith:
      - '/sh'
      - '/bash'
      - '/dash'
  condition: selection
falsepositives:
  - CGI scripts that legitimately call a shell
level: critical
tags:
  - attack.persistence
  - attack.execution
  - attack.t1505.003
  - attack.t1059.004
`,
R`title: Reconnaissance Commands by Web Service Account
id: 1c2d3e4f-5a6b-4c7d-8e8f-9a0b1c2d3e26
name: www_recon
status: test
description: Discovery commands executed as www-data.
author: Mithil K Gowda
date: 2026/10/12
logsource:
  product: linux
  category: process_creation
detection:
  selection_user:
    User: 'www-data'
  selection_cmd:
    CommandLine|re: '(^|[;&| ])(id|whoami|uname -a|hostname|cat /etc/passwd)($|[;&| ])'
  condition: all of selection_*
level: medium
tags:
  - attack.discovery
  - attack.t1033
  - attack.t1082
`,
R`title: Linux Download and Execute
id: 2d3e4f5a-6b7c-4d8e-8f9a-0b1c2d3e4f27
name: linux_download_exec
status: stable
description: wget or curl fetching a script into a temporary folder and running it.
author: Mithil K Gowda
date: 2026/10/12
logsource:
  product: linux
  category: process_creation
detection:
  selection_dl:
    CommandLine|contains:
      - 'wget '
      - 'curl '
  selection_exec:
    CommandLine|contains:
      - '| sh'
      - '| bash'
      - 'bash /tmp/'
      - 'sh /tmp/'
      - 'chmod +x /tmp/'
  condition: all of selection_*
level: high
tags:
  - attack.command-and-control
  - attack.execution
  - attack.t1105
  - attack.t1059.004
`,
R`title: Shell With Outbound Connection
id: 3e4f5a6b-7c8d-4e9f-8a0b-1c2d3e4f5a28
name: linux_reverse_shell
status: test
description: A shell process making an outbound connection to a public address, typical of a reverse shell.
author: Mithil K Gowda
date: 2026/10/13
logsource:
  product: linux
  category: network_connection
detection:
  selection:
    Image|endswith:
      - '/bash'
      - '/sh'
      - '/nc'
      - '/ncat'
  filter_private:
    DestinationIp|cidr:
      - '10.0.0.0/8'
      - '127.0.0.0/8'
  condition: selection and not filter_private
level: critical
tags:
  - attack.command-and-control
  - attack.execution
  - attack.t1059.004
  - attack.t1571
`,
R`title: Database Dump Archived in Hidden Temp Folder
id: 4f5a6b7c-8d9e-4f0a-8b1c-2d3e4f5a6b29
name: db_archive_staging
status: test
description: pg_dump output or a tar archive written to a hidden folder under /tmp, a staging step before exfiltration.
author: Mithil K Gowda
date: 2026/10/13
logsource:
  product: linux
  category: process_creation
detection:
  selection_tool:
    Image|endswith:
      - '/tar'
      - '/pg_dump'
      - '/zip'
  selection_path:
    CommandLine|re: '/tmp/\.[a-z0-9_]+/'
  filter_backup:
    User: 'svc_backup'
    CommandLine|contains: '/tmp/.backup_stage/'
  condition: all of selection_* and not filter_backup
falsepositives:
  - Backup jobs, which write to /tmp/.backup_stage and are filtered
level: medium
tags:
  - attack.collection
  - attack.t1560.001
  - attack.t1005
`,
R`title: DNS Tunnelling Long Subdomain
id: 5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c30
name: dns_long_label
status: stable
description: A DNS query with a label of 32 or more hex or base32 characters, the usual shape of data smuggled out through DNS.
author: Mithil K Gowda
date: 2026/10/14
logsource:
  category: dns
detection:
  selection:
    query|re: '(^|\.)[a-z0-9]{32,}\.'
  filter_cdn:
    query|endswith:
      - '.akamaiedge.net'
      - '.cloudfront.net'
  condition: selection and not filter_cdn
level: medium
tags:
  - attack.exfiltration
  - attack.command-and-control
  - attack.t1048.003
  - attack.t1071.004
`,
R`title: High Volume DNS Tunnelling to One Domain
id: 6b7c8d9e-0f1a-4b2c-8d3e-4f5a6b7c8d31
name: dns_tunnel_volume
status: stable
description: Twenty or more long label queries from one host to the same parent domain within two minutes.
author: Mithil K Gowda
date: 2026/10/14
correlation:
  type: event_count
  rules:
    - dns_long_label
  group-by:
    - src_host
    - query_domain
  timespan: 2m
  condition:
    gte: 20
  generate: true
level: high
tags:
  - attack.exfiltration
  - attack.t1048.003
`,
R`title: Web Vulnerability Scanner User Agent
id: 7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e32
name: web_scanner_ua
status: stable
description: Requests carrying the user agent of a known automated scanner.
author: Mithil K Gowda
date: 2026/10/15
logsource:
  category: webserver
detection:
  selection:
    cs-user-agent|contains:
      - 'sqlmap'
      - 'Nikto'
      - 'nuclei'
      - 'WPScan'
      - 'gobuster'
  condition: selection
level: medium
tags:
  - attack.reconnaissance
  - attack.t1595.002
`,
R`title: SQL Injection Returned Data
id: 8d9e0f1a-2b3c-4d4e-8f5a-6b7c8d9e0f33
name: sqli_success
status: stable
description: A UNION SELECT style payload answered with HTTP 200 and a body larger than normal, which means the injection most likely worked.
author: Mithil K Gowda
date: 2026/10/15
logsource:
  category: webserver
detection:
  selection:
    cs-uri-query|contains|all:
      - 'union'
      - 'select'
    sc-status: 200
    sc-bytes|gte: 4000
  condition: selection
level: critical
tags:
  - attack.initial-access
  - attack.t1190
`,
R`title: Web Shell Uploaded
id: 9e0f1a2b-3c4d-4e5f-8a6b-7c8d9e0f1a34
name: webshell_upload
status: test
description: A server side script file accepted by an upload endpoint, followed by requests to it with a cmd parameter.
author: Mithil K Gowda
date: 2026/10/15
logsource:
  category: webserver
detection:
  selection_upload:
    cs-method: 'POST'
    cs-uri-stem|contains: '/upload'
    cs-uri-query|re: 'filename=[^&]+\.(php|phtml|jsp|aspx)'
    sc-status:
      - 200
      - 201
  selection_exec:
    cs-uri-stem|re: '/uploads/[^/]+\.(php|phtml|jsp|aspx)$'
    cs-uri-query|startswith: 'cmd='
  condition: 1 of selection_*
level: high
tags:
  - attack.persistence
  - attack.t1505.003
`,
R`title: WAF SQL Injection Attempt
id: 0f1a2b3c-4d5e-4f6a-8b7c-8d9e0f1a2b35
name: waf_sqli
status: stable
description: The WAF matched an OWASP CRS 942 series SQL injection rule.
author: Mithil K Gowda
date: 2026/10/16
logsource:
  product: vyomrix
  service: waf
detection:
  selection:
    rule_id|startswith: '942'
  condition: selection
level: high
tags:
  - attack.initial-access
  - attack.t1190
`,
R`title: WAF Path Traversal or Local File Access
id: 1a2b3c4d-5e6f-4a7b-8c8d-9e0f1a2b3c36
name: waf_lfi
status: stable
description: The WAF matched a 930 series traversal or sensitive file rule.
author: Mithil K Gowda
date: 2026/10/16
logsource:
  product: vyomrix
  service: waf
detection:
  selection:
    rule_id|startswith: '930'
  condition: selection
level: medium
tags:
  - attack.initial-access
  - attack.t1190
`,
R`title: WAF Remote Code Execution Attempt
id: 2b3c4d5e-6f7a-4b8c-8d9e-0f1a2b3c4d37
name: waf_rce
status: stable
description: The WAF matched command injection (932), PHP injection (933) or Log4Shell (944) content.
author: Mithil K Gowda
date: 2026/10/16
logsource:
  product: vyomrix
  service: waf
detection:
  selection:
    rule_id|startswith:
      - '932'
      - '933'
      - '944'
  condition: selection
level: critical
tags:
  - attack.initial-access
  - attack.execution
  - attack.t1190
`,
R`title: WAF Cross Site Scripting Attempt
id: 3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e38
name: waf_xss
status: stable
description: The WAF matched a 941 series XSS rule.
author: Mithil K Gowda
date: 2026/10/16
logsource:
  product: vyomrix
  service: waf
detection:
  selection:
    rule_id|startswith: '941'
  condition: selection
level: medium
tags:
  - attack.initial-access
  - attack.t1190
`,
R`title: Honeypot Shell Session With Payload Download
id: 4d5e6f7a-8b9c-4d0e-8f1a-2b3c4d5e6f39
name: honeypot_download
status: stable
description: An attacker who logged in to the SSH honeypot tried to download a payload.
author: Mithil K Gowda
date: 2026/10/17
logsource:
  product: vyomrix
  service: honeypot
detection:
  selection:
    Event: 'command'
    Command|contains:
      - 'wget '
      - 'curl '
      - 'tftp '
  condition: selection
level: medium
tags:
  - attack.command-and-control
  - attack.t1105
`,
];
