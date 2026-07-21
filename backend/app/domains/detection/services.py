import yaml
from typing import List, Dict, Any, Optional
from .schemas import SigmaRule, ValidationResult, RuleStatus, RuleSeverity

class DetectionManager:
    def __init__(self):
        self._rules: Dict[str, SigmaRule] = self._seed_rules()
        
    def _seed_rules(self) -> Dict[str, SigmaRule]:
        raw_yaml = """
title: Suspicious PowerShell Execution
id: 1111-2222-3333-4444
status: active
description: Detects encoded or bypass execution policies in PowerShell.
author: Vyomrix SOC
date: 2026-07-21
logsource:
    product: windows
    service: powershell
detection:
    selection:
        EventID: 4104
        ScriptBlockText|contains: 
            - '-ExecutionPolicy Bypass'
            - '-enc'
    condition: selection
level: high
tags:
    - attack.execution
    - attack.t1059.001
"""
        parsed = yaml.safe_load(raw_yaml)
        rule = SigmaRule(
            id=parsed["id"],
            title=parsed["title"],
            description=parsed.get("description", ""),
            logsource=parsed.get("logsource", {}),
            detection=parsed.get("detection", {}),
            level=RuleSeverity.HIGH,
            status=RuleStatus.ACTIVE,
            tags=parsed.get("tags", []),
            raw_yaml=raw_yaml
        )
        return {rule.id: rule}

    def validate_sigma_rule(self, raw_yaml: str) -> ValidationResult:
        errors = []
        try:
            parsed = yaml.safe_load(raw_yaml)
            if not isinstance(parsed, dict):
                errors.append("Rule must be a YAML dictionary.")
                return ValidationResult(is_valid=False, errors=errors)
                
            required_fields = ["title", "id", "logsource", "detection", "level"]
            for field in required_fields:
                if field not in parsed:
                    errors.append(f"Missing required field: '{field}'")
                    
            if "detection" in parsed and "condition" not in parsed["detection"]:
                errors.append("Detection section must contain a 'condition' field.")
                
        except yaml.YAMLError as e:
            errors.append(f"YAML parsing error: {str(e)}")
            
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def add_rule(self, raw_yaml: str) -> SigmaRule:
        validation = self.validate_sigma_rule(raw_yaml)
        if not validation.is_valid:
            raise ValueError(f"Invalid rule: {', '.join(validation.errors)}")
            
        parsed = yaml.safe_load(raw_yaml)
        rule = SigmaRule(
            id=parsed["id"],
            title=parsed["title"],
            description=parsed.get("description", ""),
            logsource=parsed.get("logsource", {}),
            detection=parsed.get("detection", {}),
            level=RuleSeverity(parsed["level"].capitalize()),
            status=RuleStatus.TESTING, # Default to testing
            tags=parsed.get("tags", []),
            raw_yaml=raw_yaml
        )
        self._rules[rule.id] = rule
        return rule

    async def list_rules(self) -> List[SigmaRule]:
        return list(self._rules.values())
        
    async def get_rule(self, rule_id: str) -> Optional[SigmaRule]:
        return self._rules.get(rule_id)
