import io
import json
import os
import unittest
from unittest.mock import Mock, patch

from function_app import _pipeline_from_settings, _uploads, purchase_orders


class FakeFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.content_type = "application/pdf"
        self.stream = io.BytesIO(content)


class FakeFiles:
    def __init__(self, files):
        self.files = files

    def lists(self):
        return [("files", self.files)]


class ValuesOnlyFiles:
    def __init__(self, files):
        self.files = files

    def items(self):
        return []

    def values(self):
        return self.files


class FunctionTests(unittest.TestCase):
    def test_repeated_multipart_field_keeps_all_nonempty_files(self):
        request = type(
            "Request",
            (),
            {
                "files": FakeFiles(
                    [
                        FakeFile("one.pdf", b"one"),
                        FakeFile("empty.pdf", b""),
                        FakeFile("two.pdf", b"two"),
                    ]
                )
            },
        )()
        uploads = _uploads(request)
        self.assertEqual([upload.filename for upload in uploads], ["one.pdf", "two.pdf"])

    def test_uploads_supports_mapping_without_multi_items(self):
        request = type(
            "Request", (), {"files": ValuesOnlyFiles([FakeFile("one.pdf", b"one")])}
        )()
        self.assertEqual(_uploads(request)[0].filename, "one.pdf")

    def test_invalid_threshold_has_descriptive_configuration_error(self):
        settings = {
            "CONTENT_UNDERSTANDING_ENDPOINT": "https://example.test",
            "CONTENT_UNDERSTANDING_KEY": "key",
            "CONTENT_UNDERSTANDING_ANALYZER_ID": "analyzer",
            "CONTENT_SAFETY_ENDPOINT": "https://example.test",
            "CONTENT_SAFETY_KEY": "key",
            "CONTENT_SAFETY_THRESHOLD": "high",
        }
        with patch.dict(os.environ, settings, clear=True):
            with self.assertRaisesRegex(ValueError, "must be one of"):
                _pipeline_from_settings()

        settings["CONTENT_SAFETY_THRESHOLD"] = "3"
        with patch.dict(os.environ, settings, clear=True):
            with self.assertRaisesRegex(ValueError, "CONTENT_SAFETY_THRESHOLD"):
                _pipeline_from_settings()

    def test_upstream_error_details_are_not_returned(self):
        request = type(
            "Request",
            (),
            {
                "headers": {"content-type": "multipart/form-data"},
                "files": FakeFiles([FakeFile("one.pdf", b"one")]),
            },
        )()
        pipeline = Mock()
        from poc.azure_clients import AzureServiceError

        pipeline.process.side_effect = AzureServiceError("private upstream response")
        with patch("function_app._pipeline_from_settings", return_value=pipeline):
            response = purchase_orders(request)
        self.assertEqual(response.status_code, 502)
        self.assertEqual(json.loads(response.get_body()), {"error": "Document processing failed"})

    def test_configuration_details_are_not_returned(self):
        request = type(
            "Request",
            (),
            {
                "headers": {"content-type": "multipart/form-data"},
                "files": FakeFiles([FakeFile("one.pdf", b"one")]),
            },
        )()
        with patch(
            "function_app._pipeline_from_settings",
            side_effect=ValueError("Missing required setting: SECRET_NAME"),
        ):
            response = purchase_orders(request)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(json.loads(response.get_body()), {"error": "Service is misconfigured"})


if __name__ == "__main__":
    unittest.main()
