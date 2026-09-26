variable "subscription_id" {
  description = "Azure subscription that contains the existing resource group and App Service plan."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-fA-F-]{36}$", var.subscription_id))
    error_message = "subscription_id must be a valid GUID."
  }
}

variable "tenant_id" {
  description = "Microsoft Entra tenant used by the deployment workflow."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-fA-F-]{36}$", var.tenant_id))
    error_message = "tenant_id must be a valid GUID."
  }
}

variable "resource_group_name" {
  description = "Existing resource group that hosts the shared App Service plan."
  type        = string
}

variable "location" {
  description = "Azure region for resources created by this deployment."
  type        = string
}

variable "app_service_plan_name" {
  description = "Existing Windows App Service plan used by the Web App and Function App."
  type        = string
}

variable "app_service_name" {
  description = "Existing Web App that hosts the Angular/Ionic UI and Express API."
  type        = string
}

variable "name_prefix" {
  description = "CAF-compatible prefix used to name new resources."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment must be development, staging, or production."
  }
}

variable "azure_ai_services_endpoint" {
  description = "Endpoint for the existing Azure AI Services account."
  type        = string

  validation {
    condition     = can(regex("^https://", var.azure_ai_services_endpoint))
    error_message = "azure_ai_services_endpoint must use HTTPS."
  }
}

variable "azure_ai_services_resource_id" {
  description = "Resource ID of the existing Azure AI Services account."
  type        = string

  validation {
    condition     = can(regex("^/subscriptions/.+/providers/Microsoft.CognitiveServices/accounts/.+$", var.azure_ai_services_resource_id))
    error_message = "azure_ai_services_resource_id must be an Azure AI Services account resource ID."
  }
}

variable "azure_content_safety_endpoint" {
  description = "Endpoint for the existing Azure AI Content Safety API."
  type        = string

  validation {
    condition     = can(regex("^https://", var.azure_content_safety_endpoint))
    error_message = "azure_content_safety_endpoint must use HTTPS."
  }
}

variable "node_version" {
  description = "Node.js runtime used by Azure App Service and Azure Functions."
  type        = string
}

variable "function_runtime_version" {
  description = "Azure Functions host runtime major version."
  type        = string
}

variable "storage_account_tier" {
  description = "Function host storage performance tier."
  type        = string
}

variable "storage_replication_type" {
  description = "Function host storage replication type."
  type        = string
}

variable "log_analytics_sku" {
  description = "Log Analytics workspace SKU."
  type        = string
}

variable "log_retention_days" {
  description = "Log Analytics retention period."
  type        = number

  validation {
    condition     = var.log_retention_days >= 30 && var.log_retention_days <= 730
    error_message = "log_retention_days must be between 30 and 730."
  }
}

variable "allowed_origins" {
  description = "Origins allowed to call the Web App API."
  type        = list(string)

  validation {
    condition     = length(var.allowed_origins) > 0 && alltrue([for origin in var.allowed_origins : origin != "*"])
    error_message = "allowed_origins must contain explicit origins and cannot contain a wildcard."
  }
}

variable "health_check_path" {
  description = "Web App endpoint used by App Service health checks."
  type        = string
}

variable "function_health_check_path" {
  description = "Function App endpoint used by App Service health checks."
  type        = string
}

variable "health_check_eviction_time_in_min" {
  description = "Minutes an unhealthy instance remains in the load balancer before eviction."
  type        = number

  validation {
    condition     = var.health_check_eviction_time_in_min >= 2 && var.health_check_eviction_time_in_min <= 10
    error_message = "health_check_eviction_time_in_min must be between 2 and 10."
  }
}

variable "tags" {
  description = "Tags applied to managed resources."
  type        = map(string)
}
