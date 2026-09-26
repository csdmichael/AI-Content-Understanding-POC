variable "subscription_id" {
  description = "Azure subscription used by the deployment workflow."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant used by the deployment workflow."
  type        = string
}

variable "resource_group_name" {
  description = "Existing resource group where deployment and state resources are managed."
  type        = string
}

variable "location" {
  description = "Azure region for the Terraform state storage account."
  type        = string
}

variable "storage_account_name" {
  description = "Globally unique storage account name for Terraform state."
  type        = string
}

variable "container_name" {
  description = "Blob container name for Terraform state."
  type        = string
}

variable "state_key" {
  description = "Blob key for the application Terraform state."
  type        = string
}

variable "github_organization" {
  description = "GitHub organization that owns the repository."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository authorized to request deployment tokens."
  type        = string
}

variable "github_environment" {
  description = "Protected GitHub environment authorized to deploy."
  type        = string
}

variable "application_display_name" {
  description = "Display name for the GitHub Actions Microsoft Entra application."
  type        = string
}

variable "tags" {
  description = "Tags applied to bootstrap resources."
  type        = map(string)
}
