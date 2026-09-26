data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_service_plan" "plan" {
  name                = var.app_service_plan_name
  resource_group_name = data.azurerm_resource_group.rg.name
}

import {
  to = azurerm_windows_web_app.ui_app
  id = "/subscriptions/${var.subscription_id}/resourceGroups/${var.resource_group_name}/providers/Microsoft.Web/sites/${var.app_service_name}"
}

resource "azurecaf_name" "identity" {
  name          = "${var.name_prefix}-${var.environment}"
  resource_type = "azurerm_user_assigned_identity"
}

resource "azurecaf_name" "storage" {
  name          = "${var.name_prefix}-${var.environment}"
  resource_type = "azurerm_storage_account"
}

resource "azurecaf_name" "function_app" {
  name          = "${var.name_prefix}-${var.environment}"
  resource_type = "azurerm_function_app"
}

resource "azurecaf_name" "log_analytics" {
  name          = "${var.name_prefix}-${var.environment}"
  resource_type = "azurerm_log_analytics_workspace"
}

resource "azurecaf_name" "application_insights" {
  name          = "${var.name_prefix}-${var.environment}"
  resource_type = "azurerm_application_insights"
}

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
  })

  identity_ids = [azurerm_user_assigned_identity.app.id]
}

resource "azurerm_user_assigned_identity" "app" {
  name                = azurecaf_name.identity.result
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  tags                = local.common_tags
}

resource "azurerm_log_analytics_workspace" "app" {
  name                = azurecaf_name.log_analytics.result
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  sku                 = var.log_analytics_sku
  retention_in_days   = var.log_retention_days
  tags                = local.common_tags
}

resource "azurerm_application_insights" "app" {
  name                = azurecaf_name.application_insights.result
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  workspace_id        = azurerm_log_analytics_workspace.app.id
  application_type    = "web"
  tags                = local.common_tags
}

resource "azurerm_storage_account" "function" {
  name                            = azurecaf_name.storage.result
  resource_group_name             = data.azurerm_resource_group.rg.name
  location                        = var.location
  account_tier                    = var.storage_account_tier
  account_replication_type        = var.storage_replication_type
  account_kind                    = "Storage"
  min_tls_version                 = "TLS1_2"
  shared_access_key_enabled       = false
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = true
  tags                            = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_windows_web_app" "ui_app" {
  name                = var.app_service_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  service_plan_id     = data.azurerm_service_plan.plan.id

  https_only                    = true
  public_network_access_enabled = true

  identity {
    type         = "UserAssigned"
    identity_ids = local.identity_ids
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_eviction_time_in_min = var.health_check_eviction_time_in_min
    health_check_path                 = var.health_check_path
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    scm_minimum_tls_version           = "1.2"
    use_32_bit_worker                 = false

    application_stack {
      current_stack = "node"
      node_version  = var.node_version
    }

    cors {
      allowed_origins     = var.allowed_origins
      support_credentials = false
    }
  }

  app_settings = {
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.app.connection_string
    APP_SERVICE_PLAN                      = var.app_service_plan_name
    AZURE_AI_SERVICES_ENDPOINT            = var.azure_ai_services_endpoint
    AZURE_CLIENT_ID                       = azurerm_user_assigned_identity.app.client_id
    AZURE_CONTENT_SAFETY_ENDPOINT         = var.azure_content_safety_endpoint
    NODE_ENV                              = var.environment
    SCM_DO_BUILD_DURING_DEPLOYMENT        = "false"
    WEBSITE_NODE_DEFAULT_VERSION          = var.node_version
    WEBSITE_RUN_FROM_PACKAGE              = "1"
  }

  tags = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_windows_function_app" "ingest" {
  name                = azurecaf_name.function_app.result
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  service_plan_id     = data.azurerm_service_plan.plan.id

  storage_account_name          = azurerm_storage_account.function.name
  storage_uses_managed_identity = true
  functions_extension_version   = var.function_runtime_version
  https_only                    = true
  public_network_access_enabled = true

  identity {
    type         = "UserAssigned"
    identity_ids = local.identity_ids
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_eviction_time_in_min = var.health_check_eviction_time_in_min
    health_check_path                 = var.function_health_check_path
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    scm_minimum_tls_version           = "1.2"
    use_32_bit_worker                 = false

    application_stack {
      node_version = var.node_version
    }

    cors {
      allowed_origins     = var.allowed_origins
      support_credentials = false
    }
  }

  app_settings = {
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.app.connection_string
    AZURE_AI_SERVICES_ENDPOINT            = var.azure_ai_services_endpoint
    AZURE_CLIENT_ID                       = azurerm_user_assigned_identity.app.client_id
    AZURE_CONTENT_SAFETY_ENDPOINT         = var.azure_content_safety_endpoint
    AzureWebJobsStorage__accountName      = azurerm_storage_account.function.name
    AzureWebJobsStorage__clientId         = azurerm_user_assigned_identity.app.client_id
    AzureWebJobsStorage__credential       = "managedidentity"
    FUNCTIONS_WORKER_RUNTIME              = "node"
    NODE_ENV                              = var.environment
    WEBSITE_NODE_DEFAULT_VERSION          = var.node_version
    WEBSITE_RUN_FROM_PACKAGE              = "1"
  }

  tags = local.common_tags

  depends_on = [
    azurerm_role_assignment.function_blob_owner,
    azurerm_role_assignment.function_blob_contributor,
    azurerm_role_assignment.function_queue_contributor,
    azurerm_role_assignment.function_table_contributor,
    azurerm_role_assignment.function_metrics_publisher
  ]

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_role_assignment" "function_blob_owner" {
  scope                = azurerm_storage_account.function.id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "function_blob_contributor" {
  scope                = azurerm_storage_account.function.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "function_queue_contributor" {
  scope                = azurerm_storage_account.function.id
  role_definition_name = "Storage Queue Data Contributor"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "function_table_contributor" {
  scope                = azurerm_storage_account.function.id
  role_definition_name = "Storage Table Data Contributor"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "function_metrics_publisher" {
  scope                = azurerm_application_insights.app.id
  role_definition_name = "Monitoring Metrics Publisher"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "ai_services_user" {
  scope                = var.azure_ai_services_resource_id
  role_definition_name = "Cognitive Services User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_monitor_diagnostic_setting" "web_app" {
  name                       = "${var.app_service_name}-diagnostics"
  target_resource_id         = azurerm_windows_web_app.ui_app.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.app.id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "function_app" {
  name                       = "${azurerm_windows_function_app.ingest.name}-diagnostics"
  target_resource_id         = azurerm_windows_function_app.ingest.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.app.id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}
