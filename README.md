# Content Understanding + Content Safety POC

Reference implementation of a file-based guardrail:

`Salesforce → Azure Function → Content Understanding → Content Safety → downstream`

The HTTP function accepts one or more purchase-order files as `multipart/form-data`.
Each file is analyzed by a configured Content Understanding custom analyzer. Every
text value extracted from the analyzer's selected fields is then checked for hate,
self-harm, sexual, and violent content. A document that meets or exceeds the
configured severity threshold is rejected, and its extracted fields are not returned.
Approved fields are grouped under `fields.contentBlocks`, one object per analyzer
content block.

## Deployment model and service boundaries

- **Content Understanding** performs multimodal parsing and schema-driven extraction.
  The configured analyzer should use document/layout extraction plus field-level
  descriptions for the desired purchase-order schema.
- **Content Safety** is a separate policy decision after extraction. Content
  Understanding does not implicitly apply these text guardrails to extracted fields.
- **Document Intelligence** is the narrower choice when established document models,
  OCR, layout, or conventional structured-document extraction are sufficient.
  Content Understanding is appropriate when the workflow needs broader multimodal
  inputs and instruction-based schemas.
- A Foundry *project* is not a runtime dependency of this function. Content
  Understanding must be hosted by a compatible Azure AI/Foundry resource and the
  analyzer must already exist there. Content Safety may use a separate resource.

This separation makes the enforcement point explicit: no extracted values continue
downstream unless every text value passes Content Safety.

## Configuration

Copy `local.settings.example.json` to the ignored `local.settings.json` and set:

| Setting | Purpose |
| --- | --- |
| `CONTENT_UNDERSTANDING_ENDPOINT` | Azure AI/Foundry resource endpoint |
| `CONTENT_UNDERSTANDING_KEY` | Resource key (store in Key Vault in Azure) |
| `CONTENT_UNDERSTANDING_ANALYZER_ID` | Existing custom purchase-order analyzer |
| `CONTENT_SAFETY_ENDPOINT` | Content Safety endpoint |
| `CONTENT_SAFETY_KEY` | Content Safety resource key |
| `CONTENT_SAFETY_THRESHOLD` | Block at severity `2`, `4`, or `6` (default `2`) |

The function uses function-level authorization. In Azure, configure these values as
application settings/Key Vault references and do not deploy `local.settings.json`.

## Run locally

Prerequisites: Python 3.11+ and Azure Functions Core Tools.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
func start
```

Send multiple files using the same or different multipart field names:

```bash
curl -X POST "http://localhost:7071/api/purchase-orders" \
  -F "files=@samples/po-1.pdf" \
  -F "files=@samples/po-2.png"
```

The response is HTTP `200` when all documents pass and `422` when any document is
blocked. Blocked document responses include category severities but omit extracted
fields. Invalid input returns `400`/`415`; invalid configuration returns `500`, and
upstream failures return `502`, so the pipeline fails closed.

## Test

Tests use only the Python standard library and do not call Azure:

```bash
python -m unittest discover -v
```
