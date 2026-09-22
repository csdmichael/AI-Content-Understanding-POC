import json
import os

import azure.functions as func

from poc.azure_clients import (
    AzureServiceError,
    ContentSafetyClient,
    ContentUnderstandingClient,
)
from poc.pipeline import ALLOWED_THRESHOLDS, PurchaseOrderPipeline, UploadedDocument

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


def _setting(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ValueError(f"Missing required setting: {name}")
    return value


def _pipeline_from_settings() -> PurchaseOrderPipeline:
    understanding = ContentUnderstandingClient(
        _setting("CONTENT_UNDERSTANDING_ENDPOINT"),
        _setting("CONTENT_UNDERSTANDING_KEY"),
        _setting("CONTENT_UNDERSTANDING_ANALYZER_ID"),
    )
    safety = ContentSafetyClient(
        _setting("CONTENT_SAFETY_ENDPOINT"), _setting("CONTENT_SAFETY_KEY")
    )
    try:
        threshold = int(os.environ.get("CONTENT_SAFETY_THRESHOLD", "2"))
    except ValueError as error:
        raise ValueError(
            f"CONTENT_SAFETY_THRESHOLD must be one of {ALLOWED_THRESHOLDS}"
        ) from error
    return PurchaseOrderPipeline(understanding, safety, threshold)


def _uploads(request: func.HttpRequest) -> list[UploadedDocument]:
    uploads = []
    if hasattr(request.files, "getlist"):
        files = [
            file
            for name in request.files
            for file in request.files.getlist(name)
        ]
    else:
        files = list(request.files.values())
    for file in files:
        content = file.stream.read()
        if content:
            uploads.append(
                UploadedDocument(
                    filename=file.filename or "unnamed",
                    content_type=file.content_type or "application/octet-stream",
                    content=content,
                )
            )
    return uploads


def _response(body: dict, status: int) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(body), status_code=status, mimetype="application/json"
    )


@app.route(route="purchase-orders", methods=["POST"])
def purchase_orders(request: func.HttpRequest) -> func.HttpResponse:
    if "multipart/form-data" not in request.headers.get("content-type", "").lower():
        return _response({"error": "Expected multipart/form-data"}, 415)

    documents = _uploads(request)
    if not documents:
        return _response({"error": "At least one non-empty file is required"}, 400)

    try:
        pipeline = _pipeline_from_settings()
    except ValueError:
        return _response({"error": "Service is misconfigured"}, 500)

    try:
        results = [pipeline.process(document) for document in documents]
    except AzureServiceError:
        return _response({"error": "Document processing failed"}, 502)

    approved = all(result["approved"] for result in results)
    return _response(
        {"approved": approved, "documents": results},
        200 if approved else 422,
    )
