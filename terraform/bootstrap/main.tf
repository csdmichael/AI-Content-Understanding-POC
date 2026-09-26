data "azuread_client_config" "current" {}

data "azurerm_resource_group" "target" {
  name = var.resource_group_name
}

resource "azuread_application" "github_actions" {
  display_name = var.application_display_name
  owners       = [data.azuread_client_config.current.object_id]
}

resource "azuread_service_principal" "github_actions" {
  client_id = azuread_application.github_actions.client_id
  owners    = [data.azuread_client_config.current.object_id]
}

resource "azuread_application_federated_identity_credential" "github_environment" {
  application_id = azuread_application.github_actions.id
  display_name   = var.github_environment
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_organization}/${var.github_repository}:environment:${var.github_environment}"
}

resource "azurerm_storage_account" "terraform_state" {
  name                            = var.storage_account_name
  resource_group_name             = data.azurerm_resource_group.target.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  shared_access_key_enabled       = false
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = true
  tags                            = var.tags

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_storage_container" "terraform_state" {
  name               = var.container_name
  storage_account_id = azurerm_storage_account.terraform_state.id
}

resource "azurerm_role_assignment" "deployment_contributor" {
  scope                = data.azurerm_resource_group.target.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github_actions.object_id
}

resource "azurerm_role_assignment" "deployment_role_administrator" {
  scope                = data.azurerm_resource_group.target.id
  role_definition_name = "Role Based Access Control Administrator"
  principal_id         = azuread_service_principal.github_actions.object_id
}

resource "azurerm_role_assignment" "state_blob_contributor" {
  scope                = azurerm_storage_account.terraform_state.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.github_actions.object_id
}
