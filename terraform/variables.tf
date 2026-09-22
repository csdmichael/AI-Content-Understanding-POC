variable "resource_group_name" {
  description = "The name of the target Azure Resource Group hosting the App Service Plan"
  type        = string
  default     = "m365-myaacoub"
}

variable "location" {
  description = "Azure Region for resources"
  type        = string
  default     = "westus2"
}

variable "app_service_plan_name" {
  description = "The existing App Service Plan name hosting the showcase applications"
  type        = string
  default     = "caldova-showcase-plan"
}

variable "app_service_name" {
  description = "Name for the new Web App hosting the Content Understanding UI & API"
  type        = string
  default     = "ai-content-understanding-ui"
}

variable "environment" {
  description = "Deployment environment tag"
  type        = string
  default     = "production"
}

variable "azure_ai_services_endpoint" {
  description = "Endpoint URL for Azure AI Foundry / Cognitive Services account"
  type        = string
  default     = "https://foundry-myaacoub.cognitiveservices.azure.com/"
}

variable "azure_content_safety_endpoint" {
  description = "Endpoint URL for Azure AI Content Safety service"
  type        = string
  default     = "https://foundry-myaacoub.cognitiveservices.azure.com/contentsafety"
}

variable "node_default_version" {
  description = "Node.js runtime version for Windows App Service iisnode"
  type        = string
  default     = "~20"
}

variable "tags" {
  description = "Tags applied to all provisioned resources"
  type        = map(string)
  default = {
    Project     = "AI-Content-Understanding-POC"
    Owner       = "Michael Yaacoub | Sr Solution Engineer"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
