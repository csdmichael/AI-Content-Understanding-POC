output "app_service_name" {
  description = "The name of the provisioned Azure Web App"
  value       = azurerm_windows_web_app.ui_app.name
}

output "app_service_default_hostname" {
  description = "The primary public hostname of the deployed Web App"
  value       = azurerm_windows_web_app.ui_app.default_hostname
}

output "web_ui_url" {
  description = "Public URL for the Angular/Ionic Web UI"
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}"
}

output "swagger_docs_url" {
  description = "Public URL for Swagger / OpenAPI documentation"
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}/api-docs"
}

output "health_endpoint_url" {
  description = "Public URL for the Health Check API endpoint"
  value       = "https://${azurerm_windows_web_app.ui_app.default_hostname}/api/v1/health"
}
