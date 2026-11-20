"""Sigma rule evaluator.

Python twin of the TypeScript engine in frontend/src/lib/engine/sigma.ts. Both compile the
same YAML in detection_content/sigma, and tests_detection/test_sigma_parity.py checks that
they reach the same verdict on every exported event.

Supported: logsource matching, selections as maps or lists of maps, keyword lists,
wildcards, the modifiers contains, startswith, endswith, all, re (with i, m, s), cidr,
gt, gte, lt, lte, exists, windash, wide, base64 and base64offset, and conditions with
and, or, not, parentheses, "1 of", "all of" and "them".
"""

from __future__ import annotations

import base64
import ipaddress
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

import yaml

Event = Dict[str, Any]
Predicate = Callable[[Event], bool]

LEVELS = ("informational", "low", "medium", "high", "critical")
TRANSFORMS = {"wide", "utf16le", "base64", "base64offset", "windash"}
MATCHERS = {"contains", "startswith", "endswith", "re", "cidr", "gt", "gte", "lt", "lte", "exists"}
FLAGS = {"all", "i", "m", "s", "cased"}


class SigmaError(ValueError):
    """Raised when a rule cannot be compiled."""


def get_field(event: Event, name: str) -> Any:
    fields = event.get("fields", {})
    if name in fields:
        return fields[name]
    lower = name.lower()
    for key, value in fields.items():
        if key.lower() == lower:
            return value
    if lower in ("computer", "host", "hostname"):
        return event.get("host")
    if lower == "user":
        return event.get("user")
    if lower == "message":
        return event.get("message")
    return None


def _wildcard(value: str) -> str:
    out, i = [], 0
    while i < len(value):
        c = value[i]
        if c == "\\" and i + 1 < len(value) and value[i + 1] in "*?\\":
            out.append(re.escape(value[i + 1]))
            i += 2
            continue
        out.append("[\\s\\S]*" if c == "*" else "[\\s\\S]" if c == "?" else re.escape(c))
        i += 1
    return "".join(out)


def _b64offsets(data: bytes) -> List[str]:
    starts, ends = (0, 2, 3), (0, 3, 2)
    result = []
    for i in range(3):
        encoded = base64.b64encode(b" " * i + data).decode()
        end = ends[(len(data) + i) % 3]
        result.append(encoded[starts[i]: len(encoded) - end if end else None])
    return result


def _as_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _field_predicate(key: str, raw: Any) -> Predicate:
    name, *mods = key.split("|")
    for mod in mods:
        if mod not in TRANSFORMS | MATCHERS | FLAGS:
            raise SigmaError(f'Unsupported modifier "{mod}" on field {name}')
    values: List[Any] = list(raw) if isinstance(raw, list) else [raw]
    matcher = next((m for m in mods if m in MATCHERS), None)
    match_all = "all" in mods

    if matcher == "exists":
        want = values[0] is not False
        return lambda e: (get_field(e, name) not in (None, "")) == want

    values = [v if v is None or isinstance(v, (int, float)) and not isinstance(v, bool) else _as_text(v) for v in values]
    for mod in mods:
        if mod == "windash":
            values = [x for v in values for x in ([v, re.sub(r"(^|\s)-", r"\1/", v), re.sub(r"(^|\s)-", "\\1\u2013", v)] if isinstance(v, str) else [v])]
        if mod in ("base64", "base64offset"):
            wide = "wide" in mods or "utf16le" in mods
            expanded = []
            for v in values:
                if v is None:
                    expanded.append(None)
                    continue
                data = str(v).encode("utf-16-le" if wide else "utf-8")
                expanded.extend([base64.b64encode(data).decode()] if mod == "base64" else _b64offsets(data))
            values = expanded

    def single(v: Any) -> Callable[[Any], bool]:
        if v is None:
            return lambda a: a is None or a == ""
        s = _as_text(v)
        if matcher == "re":
            flags = (re.I if "i" in mods else 0) | (re.M if "m" in mods else 0) | (re.S if "s" in mods else 0)
            try:
                rx = re.compile(s, flags)
            except re.error as exc:
                raise SigmaError(f"Invalid regular expression on field {name}") from exc
            return lambda a: a is not None and rx.search(_as_text(a)) is not None
        if matcher == "cidr":
            try:
                net = ipaddress.ip_network(s, strict=False)
            except ValueError as exc:
                raise SigmaError(f'Invalid CIDR "{s}" on field {name}') from exc

            def in_net(a: Any) -> bool:
                try:
                    return a is not None and ipaddress.ip_address(str(a)) in net
                except ValueError:
                    return False
            return in_net
        if matcher in ("gt", "gte", "lt", "lte"):
            try:
                n = float(s)
            except ValueError as exc:
                raise SigmaError(f"Numeric modifier {matcher} needs a number on field {name}") from exc

            def cmp(a: Any) -> bool:
                try:
                    x = float(a)
                except (TypeError, ValueError):
                    return False
                return {"gt": x > n, "gte": x >= n, "lt": x < n, "lte": x <= n}[matcher]
            return cmp
        body = _wildcard(s)
        pattern = {"contains": body, "startswith": "^" + body, "endswith": body + "$"}.get(matcher or "", f"^{body}$")
        rx = re.compile(pattern, 0 if "cased" in mods else re.I)
        return lambda a: a is not None and rx.search(_as_text(a)) is not None

    tests = [single(v) for v in values]
    if match_all:
        return lambda e: all(t(get_field(e, name)) for t in tests)
    return lambda e: any(t(get_field(e, name)) for t in tests)


def _selection(name: str, value: Any) -> Predicate:
    if isinstance(value, list):
        if all(isinstance(v, dict) for v in value):
            alts = [_selection(f"{name}[{i}]", v) for i, v in enumerate(value)]
            return lambda e: any(p(e) for p in alts)
        words = [re.compile(_wildcard(_as_text(v) or ""), re.I) for v in value]
        return lambda e: any(w.search(e.get("message", "")) for w in words)
    if isinstance(value, dict):
        preds = [_field_predicate(k, v) for k, v in value.items()]
        return lambda e: all(p(e) for p in preds)
    raise SigmaError(f'Search identifier "{name}" must be a map or a list')


def _condition(text: str, selections: Dict[str, Predicate]) -> Predicate:
    tokens = text.replace("(", " ( ").replace(")", " ) ").split()
    pos = 0

    def peek() -> Optional[str]:
        return tokens[pos].lower() if pos < len(tokens) else None

    def resolve(pattern: str) -> List[str]:
        if pattern == "them":
            return [k for k in selections if not k.startswith("_")]
        rx = re.compile("^" + _wildcard(pattern) + "$")
        names = [k for k in selections if rx.match(k)]
        if not names:
            raise SigmaError(f'Condition refers to "{pattern}" but no such search identifier exists')
        return names

    def primary() -> Predicate:
        nonlocal pos
        if pos >= len(tokens):
            raise SigmaError("Condition ended unexpectedly")
        t = tokens[pos]
        if t == "(":
            pos += 1
            inner = or_expr()
            if pos >= len(tokens) or tokens[pos] != ")":
                raise SigmaError("Missing closing parenthesis in condition")
            pos += 1
            return inner
        if t.lower() in ("1", "all", "any") and pos + 1 < len(tokens) and tokens[pos + 1].lower() == "of":
            if pos + 2 >= len(tokens):
                raise SigmaError(f'"{t} of" needs a target')
            preds = [selections[n] for n in resolve(tokens[pos + 2])]
            pos += 3
            if t.lower() == "all":
                return lambda e: all(p(e) for p in preds)
            return lambda e: any(p(e) for p in preds)
        pos += 1
        names = resolve(t)
        if names != [t]:
            raise SigmaError(f'Unknown search identifier "{t}"')
        return selections[t]

    def not_expr() -> Predicate:
        nonlocal pos
        if peek() == "not":
            pos += 1
            inner = not_expr()
            return lambda e: not inner(e)
        return primary()

    def and_expr() -> Predicate:
        nonlocal pos
        left = not_expr()
        while peek() == "and":
            pos += 1
            l, r = left, not_expr()
            left = lambda e, l=l, r=r: l(e) and r(e)
        return left

    def or_expr() -> Predicate:
        nonlocal pos
        left = and_expr()
        while peek() == "or":
            pos += 1
            l, r = left, and_expr()
            left = lambda e, l=l, r=r: l(e) or r(e)
        return left

    result = or_expr()
    if pos < len(tokens):
        raise SigmaError(f'Unexpected "{tokens[pos]}" in condition')
    return result


@dataclass
class CompiledRule:
    id: str
    name: Optional[str]
    title: str
    level: str
    kind: str
    tags: List[str] = field(default_factory=list)
    logsource: Dict[str, str] = field(default_factory=dict)
    correlation: Optional[Dict[str, Any]] = None
    _test: Optional[Predicate] = None

    @property
    def techniques(self) -> List[str]:
        return [t[7:].upper() for t in self.tags if re.match(r"^attack\.t\d{4}", t)]

    def matches(self, event: Event) -> bool:
        if self._test is None:
            raise SigmaError("Correlation rules are evaluated by the correlation layer, not per event")
        source = event.get("logsource", {})
        if any((source.get(k) or "").lower() != v for k, v in self.logsource.items()):
            return False
        return self._test(event)


def compile_rule(text: str) -> CompiledRule:
    try:
        doc = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        raise SigmaError(f"Invalid YAML: {exc}") from exc
    if not isinstance(doc, dict):
        raise SigmaError("A Sigma rule must be a YAML map")
    title = _as_text(doc.get("title")) or ""
    if not title:
        raise SigmaError("Rule needs a title")
    level = (_as_text(doc.get("level")) or "medium").lower()
    if level not in LEVELS:
        raise SigmaError(f"Level must be one of {', '.join(LEVELS)}")
    tags = [str(t).lower() for t in doc.get("tags") or []]
    base = dict(id=_as_text(doc.get("id")) or title, name=_as_text(doc.get("name")), title=title, level=level, tags=tags)
    if isinstance(doc.get("correlation"), dict):
        return CompiledRule(kind="correlation", correlation=doc["correlation"], **base)
    ls = doc.get("logsource")
    if not isinstance(ls, dict):
        raise SigmaError("Rule needs a logsource map")
    det = doc.get("detection")
    if not isinstance(det, dict) or "condition" not in det:
        raise SigmaError("Rule needs a detection map with a condition")
    selections = {k: _selection(k, v) for k, v in det.items() if k not in ("condition", "timeframe")}
    if not selections:
        raise SigmaError("Detection needs at least one search identifier")
    conds = det["condition"] if isinstance(det["condition"], list) else [det["condition"]]
    compiled = [_condition(str(c), selections) for c in conds]
    logsource = {k: str(v).lower() for k, v in ls.items() if k in ("product", "category", "service") and v is not None}
    return CompiledRule(kind="event", logsource=logsource, _test=lambda e: any(p(e) for p in compiled), **base)
