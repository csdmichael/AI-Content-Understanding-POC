output "azure_client_id" {
  description = "Client ID used by GitHub Actions OIDC authentication."
  value       = azuread_application.github_actions.client_id
}

output "azure_tenant_id" {
  description = "Microsoft Entra tenant ID used by GitHub Actions."
  value       = var.tenant_id
}

output "azure_subscription_id" {
  description = "Azure subscription ID used by GitHub Actions."
  value       = var.subscription_id
}

output "backend_resource_group" {
  description = "Resource group containing Terraform state."
  value       = data.azurerm_resource_group.target.name
}

output "backend_storage_account" {
  description = "Storage account containing Terraform state."
  value       = azurerm_storage_account.terraform_state.name
}

output "backend_container" {
  description = "Blob container containing Terraform state."
  value       = azurerm_storage_container.terraform_state.name
}

output "backend_key" {
  description = "Blob key used for the application Terraform state."
  value       = var.state_key
}
