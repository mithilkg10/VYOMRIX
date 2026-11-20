import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional
from .schemas import SigmaRule, ValidationResult, RuleStatus, RuleSeverity
from .sigma_engine import CompiledRule, SigmaError, compile_rule

CONTENT_DIR = Path(__file__).resolve().parents[4] / "detection_content" / "sigma"

class DetectionManager:
    def __init__(self):
        self._rules: Dict[str, SigmaRule] = {}
        self._compiled: Dict[str, CompiledRule] = {}

    def load_content(self, directory: Path = CONTENT_DIR) -> int:
        """Compiles every Sigma file in the shared detection content folder."""
        for path in sorted(directory.glob("*.yml")):
            rule = compile_rule(path.read_text())
            self._compiled[rule.name or rule.id] = rule
        return len(self._compiled)

    def evaluate(self, event: Dict[str, Any]) -> List[str]:
        """Returns the names of single event rules that match a normalised event."""
        if not self._compiled:
            self.load_content()
        return [name for name, rule in self._compiled.items() if rule.kind == "event" and rule.matches(event)]

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

        if not errors:
            try:
                compile_rule(raw_yaml)
            except SigmaError as e:
                errors.append(str(e))
            
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
