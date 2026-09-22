import json
import time
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


class AzureServiceError(RuntimeError):
    """An Azure service request failed."""


def _request_json(request: Request, timeout: float) -> tuple[int, dict, dict]:
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = response.read()
            return response.status, dict(response.headers), json.loads(payload or b"{}")
    except HTTPError as error:
        raise AzureServiceError(
            f"Azure request failed with status {error.code}"
        ) from error
    except (URLError, TimeoutError) as error:
        raise AzureServiceError(f"Azure request failed: {error}") from error


class ContentUnderstandingClient:
    API_VERSION = "2025-05-01-preview"

    def __init__(
        self,
        endpoint: str,
        key: str,
        analyzer_id: str,
        *,
        request_json: Callable = _request_json,
        sleep: Callable[[float], None] = time.sleep,
        poll_interval: float = 1,
        max_polls: int = 120,
    ):
        self.endpoint = endpoint.rstrip("/")
        self.key = key
        self.analyzer_id = analyzer_id
        self.request_json = request_json
        self.sleep = sleep
        self.poll_interval = poll_interval
        self.max_polls = max_polls

    def analyze(self, content: bytes, content_type: str) -> dict:
        analyzer = quote(self.analyzer_id, safe="")
        url = (
            f"{self.endpoint}/contentunderstanding/analyzers/{analyzer}:analyze"
            f"?api-version={self.API_VERSION}"
        )
        request = Request(
            url,
            data=content,
            method="POST",
            headers={
                "Ocp-Apim-Subscription-Key": self.key,
                "Content-Type": content_type or "application/octet-stream",
            },
        )
        status, headers, body = self.request_json(request, 60)
        if status not in (200, 201, 202):
            raise AzureServiceError(f"Unexpected Content Understanding status {status}")
        if status != 202:
            return body

        operation_headers = {key.lower(): value for key, value in headers.items()}
        operation_url = operation_headers.get("operation-location")
        if not operation_url:
            raise AzureServiceError("Content Understanding omitted Operation-Location")

        for attempt in range(self.max_polls):
            poll = Request(
                operation_url,
                headers={"Ocp-Apim-Subscription-Key": self.key},
            )
            poll_status, _, operation = self.request_json(poll, 30)
            if poll_status != 200:
                raise AzureServiceError(
                    f"Unexpected Content Understanding poll status {poll_status}"
                )
            operation_status = str(operation.get("status", "")).lower()
            if operation_status == "succeeded":
                return operation
            if operation_status in {"failed", "canceled", "cancelled"}:
                raise AzureServiceError(
                    f"Content Understanding operation {operation_status}"
                )
            if attempt < self.max_polls - 1:
                self.sleep(self.poll_interval)
        raise AzureServiceError("Content Understanding operation timed out")


class ContentSafetyClient:
    API_VERSION = "2024-09-01"
    CATEGORIES = ("Hate", "SelfHarm", "Sexual", "Violence")

    def __init__(
        self,
        endpoint: str,
        key: str,
        *,
        request_json: Callable = _request_json,
    ):
        self.endpoint = endpoint.rstrip("/")
        self.key = key
        self.request_json = request_json

    def analyze_text(self, text: str) -> list[dict]:
        url = (
            f"{self.endpoint}/contentsafety/text:analyze"
            f"?api-version={self.API_VERSION}"
        )
        request = Request(
            url,
            data=json.dumps(
                {
                    "text": text,
                    "categories": list(self.CATEGORIES),
                    "outputType": "FourSeverityLevels",
                }
            ).encode("utf-8"),
            method="POST",
            headers={
                "Ocp-Apim-Subscription-Key": self.key,
                "Content-Type": "application/json",
            },
        )
        status, _, body = self.request_json(request, 30)
        if status != 200:
            raise AzureServiceError(f"Unexpected Content Safety status {status}")
        return body.get("categoriesAnalysis", [])
