import unittest

from poc.pipeline import PurchaseOrderPipeline, UploadedDocument, extract_fields


class FakeUnderstanding:
    def __init__(self, fields):
        self.fields = fields

    def analyze(self, content, content_type):
        return {"status": "Succeeded", "result": {"contents": [{"fields": self.fields}]}}


class FakeSafety:
    def __init__(self, severity=0):
        self.severity = severity
        self.seen = []

    def analyze_text(self, text):
        self.seen.append(text)
        return [{"category": "Violence", "severity": self.severity}]


class PipelineTests(unittest.TestCase):
    def test_normalizes_nested_content_understanding_fields(self):
        fields = extract_fields(
            {
                "result": {
                    "contents": [
                        {
                            "fields": {
                                "Vendor": {"type": "string", "valueString": "Contoso"},
                                "Lines": {
                                    "type": "array",
                                    "valueArray": [
                                        {
                                            "type": "object",
                                            "valueObject": {
                                                "Quantity": {
                                                    "type": "number",
                                                    "valueNumber": 3,
                                                }
                                            },
                                        }
                                    ],
                                },
                            }
                        }
                    ]
                }
            }
        )
        self.assertEqual(fields, {"Vendor": "Contoso", "Lines": [{"Quantity": 3}]})

    def test_approved_document_includes_fields(self):
        safety = FakeSafety()
        pipeline = PurchaseOrderPipeline(
            FakeUnderstanding({"Vendor": {"valueString": "Contoso"}}), safety
        )
        result = pipeline.process(UploadedDocument("po.pdf", "application/pdf", b"pdf"))
        self.assertTrue(result["approved"])
        self.assertEqual(result["fields"], {"Vendor": "Contoso"})
        self.assertEqual(safety.seen, ["Contoso"])

    def test_unsafe_document_is_blocked_and_fields_are_not_returned(self):
        pipeline = PurchaseOrderPipeline(
            FakeUnderstanding({"Notes": {"valueString": "unsafe text"}}),
            FakeSafety(severity=2),
        )
        result = pipeline.process(UploadedDocument("po.pdf", "application/pdf", b"pdf"))
        self.assertFalse(result["approved"])
        self.assertNotIn("fields", result)
        self.assertFalse(result["safetyChecks"][0]["approved"])

    def test_invalid_threshold_is_rejected(self):
        with self.assertRaises(ValueError):
            PurchaseOrderPipeline(FakeUnderstanding({}), FakeSafety(), threshold=3)


if __name__ == "__main__":
    unittest.main()

