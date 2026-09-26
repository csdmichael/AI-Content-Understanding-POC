output "app_service_name" {
  description = "Name of the managed Azure Web App."
  value       = azurerm_windows_web_app.ui_app.name
}

output "function_app_name" {
  description = "Name of the Salesforce ingestion Function App."
  value       = azurerm_windows_function_app.ingest.name
}

output "web_ui_url" {
  description = "Public URL for the Angular/Ionic Web UI."
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}"
}

output "swagger_docs_url" {
  description = "Public URL for Swagger/OpenAPI documentation."
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}/api-docs"
}

output "health_endpoint_url" {
  description = "Public URL for the Web App health endpoint."
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}${var.health_check_path}"
}

output "function_app_url" {
  description = "Public URL for the Salesforce ingestion Function App."
  value       = "https://${azurerm_windows_function_app.ingest.default_hostname}"
}

output "function_health_endpoint_url" {
  description = "Public URL used to verify the Function host is reachable."
  value       = "https://${azurerm_windows_function_app.ingest.default_hostname}${var.function_health_check_path}"
}

output "managed_identity_client_id" {
  description = "Client ID of the user-assigned identity used by both applications."
  value       = azurerm_user_assigned_identity.app.client_id
}
