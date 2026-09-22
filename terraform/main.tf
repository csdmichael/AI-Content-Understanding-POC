# Query existing Resource Group and App Service Plan
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_service_plan" "plan" {
  name                = var.app_service_plan_name
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Web App hosting Angular/Ionic UI & Node.js Express API on the shared App Service Plan
resource "azurerm_windows_web_app" "ui_app" {
  name                = var.app_service_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = var.location
  service_plan_id     = data.azurerm_service_plan.plan.id

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true

    application_stack {
      current_stack  = "node"
      node_version   = var.node_default_version
    }

    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }

    use_32_bit_worker = false
  }

  app_settings = {
    "NODE_ENV"                       = var.environment
    "WEBSITE_NODE_DEFAULT_VERSION"   = var.node_default_version
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "AZURE_AI_SERVICES_ENDPOINT"     = var.azure_ai_services_endpoint
    "AZURE_CONTENT_SAFETY_ENDPOINT"  = var.azure_content_safety_endpoint
    "APP_SERVICE_PLAN"               = "${var.app_service_plan_name} (${var.location})"
  }

  tags = var.tags
}
