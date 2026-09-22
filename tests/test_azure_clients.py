import json
import unittest

from poc.azure_clients import (
    AzureServiceError,
    ContentSafetyClient,
    ContentUnderstandingClient,
)


class AzureClientTests(unittest.TestCase):
    def test_content_understanding_posts_file_and_polls_operation(self):
        requests = []
        responses = iter(
            [
                (202, {"Operation-Location": "https://example.test/operations/1"}, {}),
                (200, {}, {"status": "Running"}),
                (200, {}, {"status": "Succeeded", "result": {"contents": []}}),
            ]
        )

        def request_json(request, timeout):
            requests.append(request)
            return next(responses)

        client = ContentUnderstandingClient(
            "https://example.test",
            "key",
            "purchase orders",
            request_json=request_json,
            sleep=lambda _: None,
        )
        result = client.analyze(b"document", "application/pdf")
        self.assertEqual(result["status"], "Succeeded")
        self.assertIn("purchase%20orders:analyze", requests[0].full_url)
        self.assertEqual(requests[0].data, b"document")
        self.assertEqual(requests[0].get_header("Content-type"), "application/pdf")
        self.assertEqual(requests[1].full_url, "https://example.test/operations/1")

    def test_content_safety_requests_all_harm_categories(self):
        captured = {}

        def request_json(request, timeout):
            captured.update(json.loads(request.data))
            return 200, {}, {"categoriesAnalysis": [{"category": "Hate", "severity": 0}]}

        result = ContentSafetyClient(
            "https://example.test", "key", request_json=request_json
        ).analyze_text("vendor")
        self.assertEqual(captured["text"], "vendor")
        self.assertEqual(
            captured["categories"], ["Hate", "SelfHarm", "Sexual", "Violence"]
        )
        self.assertEqual(result[0]["severity"], 0)

    def test_content_understanding_rejects_failed_poll_response(self):
        responses = iter(
            [
                (202, {"Operation-Location": "https://example.test/operations/1"}, {}),
                (503, {}, {}),
            ]
        )
        client = ContentUnderstandingClient(
            "https://example.test",
            "key",
            "purchase-orders",
            request_json=lambda request, timeout: next(responses),
            sleep=lambda _: None,
        )
        with self.assertRaisesRegex(AzureServiceError, "poll status 503"):
            client.analyze(b"document", "application/pdf")


if __name__ == "__main__":
    unittest.main()
