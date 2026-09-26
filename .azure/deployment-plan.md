# Azure Deployment Plan

> **Status:** Validated

Generated: 2026-09-25T18:25:00-07:00

---

## 1. Project Overview

**Goal:** Generate production-oriented Terraform and GitHub Actions workflows that provision and deploy the complete Azure AI Content Understanding POC without embedding environment-specific values in application code or deployment scripts.

**Path:** Add Components / Modernize Existing

The existing Angular/Ionic frontend and Node.js Express API will remain hosted together in `ai-content-understanding-ui`. The Salesforce purchase-order ingestion code will be deployed as a separate Azure Function App on the existing `caldova-showcase-plan`. Existing Azure AI/Foundry services will be referenced through configuration rather than provisioned by this project.

---

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | POC |
| Scale | Large (100,000+ users requested) |
| Budget | Balanced |
| Compliance | Azure security best practices; no additional regulatory or residency requirement |
| Environment | Production only |
| Subscription | `ME-Caldova37587778-myaacoub-1` (`cf824570-a8ba-497a-a184-0a52f1830aa9`) |
| Tenant | `12a4b86b-e64c-43f9-af05-d9130a72dfd2` |
| Resource Group | Existing `m365-myaacoub` |
| Location | West US 2 |
| Shared App Service Plan | Existing `caldova-showcase-plan` (Windows B1, one worker) |
| AI Services | Reuse existing services through configuration |
| CI/CD | GitHub Actions with Microsoft Entra workload identity federation (OIDC) |
| Configuration | Environment values in Terraform variable files, backend config, and GitHub environment variables/secrets; no environment-specific literals in scripts |

### Scale Constraint

The selected shared plan is Basic B1 with one worker. Basic App Service does not support Azure autoscale and cannot credibly satisfy a sustained 100,000+ user workload. Per user direction, Terraform will reuse the B1 plan and document this limitation rather than modify a shared resource. The generated configuration will make the plan replaceable, and the README will identify Premium v3 plus autoscale as the production-scale upgrade path.

### Policy Constraints

The selected scope inherits:

- Azure Security Baseline.
- MCAPSGov deny, deploy/modify, and audit initiatives.
- A policy that blocks Azure Resource Manager resource creation unless the subscription/resource group is exempted.
- A policy that blocks West Europe; West US 2 is the confirmed target.
- Microsoft Defender/Data Protection assignments.

Terraform plan/apply can therefore be denied even when syntax and quota checks pass. CI will surface policy failures explicitly. Existing-resource reuse minimizes new-resource creation.

---

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| Adaptive UI | Frontend | Angular 21, Ionic 9, TypeScript | `frontend/` |
| UI/API host | Web/API | Node.js 20, Express 4 | `server.js` |
| Salesforce PO ingestion | Function | Azure Functions, Node.js | `function-app/` |
| Content Understanding integration | Integration client | Axios / Azure AI REST API | `function-app/shared/contentUnderstandingClient.js` |
| Content Safety guardrails | Integration client | Axios / Azure AI REST API | `function-app/shared/contentSafetyClient.js` |
| Large-context scanning | Domain service | Sliding-window chunking | `function-app/shared/largeContextChunker.js` |
| Sample purchase orders | Demo data | JSON/PDF/TXT assets | `data/` |
| Existing IaC | Infrastructure | Terraform AzureRM 3.x | `terraform/` |

---

## 4. Recipe Selection

**Selected:** Pure Terraform plus GitHub Actions

**Rationale:** The repository already uses Terraform, and the user explicitly requested Terraform and GitHub workflows. The implementation will preserve that workflow instead of introducing an additional `azd` wrapper.

Terraform state will use an Azure Storage backend configured by a separate backend configuration file. CI will authenticate to Azure using GitHub OIDC, run validation and plan for pull requests, and run reviewed infrastructure/application deployment from the default branch or by manual dispatch.

---

## 5. Architecture

**Stack:** Shared Windows App Service Plan

### Service Mapping

| Component | Azure Service | SKU / Hosting |
|-----------|---------------|---------------|
| Angular/Ionic UI + Express API | Existing Azure App Service `ai-content-understanding-ui` | Existing Windows B1 plan |
| Salesforce PO ingestion | New Azure Function App | Existing Windows B1 plan |
| Function runtime storage | New Azure Storage Account | Standard LRS |
| Application telemetry | New workspace-based Application Insights | Consumption-based |
| Secret storage | Existing GitHub environment secrets injected as sensitive Terraform inputs and App Service settings; no secret values committed | N/A |
| Content Understanding / Content Safety | Existing Azure AI Services / Foundry endpoints | Reused, not Terraform-managed |

### Deployment Flow

1. Pull requests run Node tests, frontend tests/build, Terraform formatting/validation, and a speculative Terraform plan.
2. A manually approved deployment runs Terraform plan/apply using the production variable file and remote backend config.
3. The workflow builds one Web App ZIP package and one Function App ZIP package.
4. The workflow deploys each package to the Terraform output app names.
5. Post-deployment checks call the UI/API health endpoint and Function host endpoint and fail on inaccessible deployments.

### Security and Reliability

- GitHub Actions uses short-lived OIDC tokens, not stored Azure client secrets.
- Provider and actions versions are pinned.
- Terraform input validation rejects invalid names, endpoints, and environment values.
- App Service HTTPS-only, minimum TLS 1.2, FTPS disabled, HTTP/2 enabled, managed identities enabled, and health checks configured.
- CORS origins are configuration-driven; wildcard CORS is removed.
- Secrets are marked sensitive and supplied through GitHub environment secrets.
- The workflow uses concurrency controls and a protected `production` GitHub environment.
- Deployment scripts contain no subscription IDs, resource names, endpoints, or credentials.

---

## 6. Provisioning Limit Checklist

### Resource Inventory and Capacity

| Resource Type | Number to Deploy | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|------------------------|-------------|-------|
| `Microsoft.Web/sites` (Web App) | 0 new; 1 managed existing | 5 existing apps on shared plan | Unlimited apps for Basic tier; compute capacity is the practical limit | `ai-content-understanding-ui` already exists |
| `Microsoft.Web/sites` (Function App) | 1 | 6 apps on shared plan | Unlimited apps for Basic tier; compute capacity is the practical limit | New Function App shares one B1 worker |
| `Microsoft.Storage/storageAccounts` | 1 | 4 in West US 2 | 250 | Azure Quota CLI: `StorageAccounts`; current usage 3, available 247 |
| `Microsoft.Insights/components` | 1 | Existing count plus 1 | No adjustable regional quota exposed for this resource type | Workspace-based Application Insights |

**Status:** All count-based resources are within published limits. The existing B1 worker capacity is intentionally accepted as a POC limitation and is insufficient for the requested large-scale production load.

---

## 6.1 Planned Artifacts

- Refactor `terraform/` into a complete, validated deployment definition with:
  - provider/backend declarations;
  - data sources for the existing resource group, App Service plan, and AI account;
  - Web App and Function App resources;
  - Function storage and Application Insights;
  - input validation, sensitive variables, outputs, lifecycle safeguards, and configuration-only values;
  - production example variable and backend configuration files with placeholders.
- Add `.github/workflows/ci.yml` for application and Terraform validation.
- Add `.github/workflows/deploy.yml` for OIDC-authenticated Terraform apply, application packaging, deployment, and health verification.
- Add reusable PowerShell deployment helpers only where GitHub Actions cannot express the operation directly; helpers will consume config/environment inputs and contain no deployment constants.
- Update the root README deployment, configuration, architecture, scaling, security, and GitHub environment setup sections while preserving a single repository README.
- Remove environment-specific defaults from Terraform variables and application runtime fallbacks that would otherwise bypass required configuration.
- Add or update tests directly related to configuration loading and deployable package behavior.

---

## 7. Validation Proof

Preparation checks completed on 2026-09-25:

| Check | Command | Result |
|-------|---------|--------|
| API behavior | `npm test` | Passed: 7 API scenarios/check groups |
| Frontend unit tests | `npm test -- --watch=false` in `frontend/` | Passed: 2 tests |
| Production application build | `npm run build` | Passed; one existing Angular bundle-budget warning |
| Deployment source syntax | `node --check` for Web App and Function App sources | Passed |
| Workflow YAML parsing | Parsed both workflow files with `yamljs` | Passed |
| Terraform formatting | `terraform fmt -recursive` | Passed |
| Terraform validation | `terraform validate` | Passed |
| Terraform production plan | `terraform plan -refresh=false -var-file=../config/production.tfvars.json` with a temporary local validation backend | Passed: no destroy actions |
| Authoritative preflight runner | `validate-terraform.ps1` | Runner defect detected: array arguments are splatted positionally, causing bare `terraform` invocations; documented checks were rerun directly |
| Documented Terraform preflight | `terraform init`, `fmt -check`, `validate`, `plan -var-file=main.tfvars.json`, `state list`, template scan, JSON parse | Passed |
| Policy review | Azure Policy assignment list for the target resource group scope | Passed with deployment-deny risk documented |
| Static RBAC review | Terraform role assignment review against application operations | Passed |

Validation workflow timestamp: 2026-09-25T19:03:00-07:00.

### Role Assignment Verification

- **Status:** Verified
- **Identity checked:** Shared user-assigned identity attached to the Web App and Function App.
- **Azure AI Services:** `Cognitive Services User`, scoped to the configured existing Azure AI Services account, supports token-authenticated Content Understanding and Content Safety calls.
- **Function storage:** `Storage Blob Data Owner`, `Storage Blob Data Contributor`, `Storage Queue Data Contributor`, and `Storage Table Data Contributor`, each scoped to the Function host storage account.
- **Monitoring:** `Monitoring Metrics Publisher`, scoped to the solution Application Insights component.
- **Issues:** No missing data-plane roles found. Blob Owner and Blob Contributor overlap, but both are retained to comply with the required Azure Function Terraform rules.

---

## 8. Execution Checklist

### Phase 1: Planning

- [x] Analyze workspace
- [x] Gather requirements
- [x] Confirm subscription and location
- [x] Scan codebase
- [x] Inspect existing Azure resources
- [x] Inspect applicable policy assignments
- [x] Check storage account quota through Azure Quota CLI
- [x] Select Terraform recipe
- [x] Plan architecture
- [ ] User approved this plan

### Phase 2: Execution

- [x] Research Azure/Terraform/GitHub Actions best practices
- [x] Generate and harden Terraform
- [x] Generate CI and deployment workflows
- [x] Externalize application/deployment configuration
- [x] Update the root README
- [x] Run application tests and builds
- [x] Run Terraform formatting, initialization, validation, and plan checks
- [x] Update status to `Ready for Validation`
- [ ] Invoke `azure-validate`

### Azure Validate Gate

- [x] All validation checks pass
  - [x] Terraform is installed
  - [x] Azure CLI is installed
  - [x] Azure CLI authentication and selected subscription are valid
  - [x] Terraform backend initialization succeeds
  - [x] Terraform formatting check succeeds
  - [x] Terraform configuration validation succeeds
  - [x] Terraform production plan succeeds
  - [x] Terraform state is readable
  - [x] No unresolved Go-style environment templates remain
  - [x] Terraform JSON variable files have valid syntax
  - [x] Applicable Azure policies are reviewed
  - [x] Deployment identity roles are sufficient

---

## 9. Deployment Notes

This task generates and validates deployment artifacts; it does not execute `terraform apply` or deploy application packages. Deployment execution remains an explicit, protected GitHub Actions operation after validation.
