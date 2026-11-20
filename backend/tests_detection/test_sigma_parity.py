"""The Python evaluator must agree with the TypeScript engine on every exported event.

Fixtures come from the browser engine: all events produced by the three Attack Lab
scenarios plus a sample of background traffic, each with the list of rules the
TypeScript compiler matched. Regenerate them with scripts/export-detection_content.
"""

import json
from pathlib import Path

import pytest

from app.domains.detection.sigma_engine import SigmaError, compile_rule

ROOT = Path(__file__).resolve().parents[2]
RULE_DIR = ROOT / "detection_content" / "sigma"
FIXTURES = json.loads((Path(__file__).parent / "sigma_parity.json").read_text())
RULES = {p.stem: compile_rule(p.read_text()) for p in sorted(RULE_DIR.glob("*.yml"))}
EVENT_RULES = {n: r for n, r in RULES.items() if r.kind == "event"}


def test_all_rules_compile():
    assert len(RULES) >= 35
    assert all(r.techniques for r in RULES.values()), "every rule carries an ATT&CK technique tag"


@pytest.mark.parametrize("case", FIXTURES, ids=lambda c: c["event"]["id"])
def test_parity_with_typescript_engine(case):
    got = sorted(name for name, rule in EVENT_RULES.items() if rule.matches(case["event"]))
    assert got == case["matches"]


def test_attack_scenarios_are_detected():
    fired = {m for c in FIXTURES if c["event"]["run"] for m in c["matches"]}
    for rule in ["office_spawn_shell", "ps_encoded_cradle", "lsass_comsvcs_dump", "psexec_service", "shadow_copy_delete",
                 "sqli_success", "webshell_upload", "webserver_shell", "linux_reverse_shell", "db_archive_staging", "dns_long_label"]:
        assert rule in fired


def test_backup_job_is_filtered():
    event = {"host": "db-lab-01", "logsource": {"product": "linux", "category": "process_creation"},
             "fields": {"Image": "/usr/bin/tar", "CommandLine": "tar czf /tmp/.backup_stage/x.tgz /var/backups", "User": "svc_backup"}}
    assert not RULES["db_archive_staging"].matches(event)


@pytest.mark.parametrize("bad, message", [
    ("title: x\nlogsource: {category: dns}\ndetection: {a: {q: 1}, condition: a and b}", "no such search identifier"),
    ("title: x\nlogsource: {category: dns}\ndetection: {a: {'q|nope': 1}, condition: a}", "Unsupported modifier"),
    ("logsource: {category: dns}", "title"),
])
def test_errors_are_explained(bad, message):
    with pytest.raises(SigmaError, match=message):
        compile_rule(bad)
