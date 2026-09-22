from dataclasses import dataclass
from typing import Any

from poc.azure_clients import ContentSafetyClient, ContentUnderstandingClient


@dataclass(frozen=True)
class UploadedDocument:
    filename: str
    content_type: str
    content: bytes


def _field_value(field: Any) -> Any:
    if not isinstance(field, dict):
        return field
    if "valueObject" in field:
        return {name: _field_value(value) for name, value in field["valueObject"].items()}
    if "valueArray" in field:
        return [_field_value(value) for value in field["valueArray"]]
    for key in (
        "valueString",
        "valueNumber",
        "valueInteger",
        "valueBoolean",
        "valueDate",
        "valueTime",
    ):
        if key in field:
            return field[key]
    return field.get("content")


def extract_fields(operation: dict) -> dict:
    result = operation.get("result", operation)
    contents = result.get("contents") or []
    if not contents:
        return {}
    fields = contents[0].get("fields") or {}
    return {name: _field_value(field) for name, field in fields.items()}


def _text_values(value: Any, path: str = ""):
    if isinstance(value, str) and value.strip():
        yield path, value
    elif isinstance(value, dict):
        for name, child in value.items():
            child_path = f"{path}.{name}" if path else name
            yield from _text_values(child, child_path)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from _text_values(child, f"{path}[{index}]")


class PurchaseOrderPipeline:
    def __init__(
        self,
        understanding: ContentUnderstandingClient,
        safety: ContentSafetyClient,
        threshold: int = 2,
    ):
        if threshold not in (0, 2, 4, 6):
            raise ValueError("Safety threshold must be one of 0, 2, 4, or 6")
        self.understanding = understanding
        self.safety = safety
        self.threshold = threshold

    def process(self, document: UploadedDocument) -> dict:
        operation = self.understanding.analyze(
            document.content, document.content_type
        )
        fields = extract_fields(operation)
        checks = []
        approved = True
        for path, text in _text_values(fields):
            analyses = self.safety.analyze_text(text)
            maximum = max(
                (int(item.get("severity", 0)) for item in analyses), default=0
            )
            checks.append(
                {"field": path, "approved": maximum < self.threshold, "categories": analyses}
            )
            approved = approved and maximum < self.threshold

        result = {
            "filename": document.filename,
            "approved": approved,
            "safetyChecks": checks,
        }
        if approved:
            result["fields"] = fields
        return result

