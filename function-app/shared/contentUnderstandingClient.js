/**
 * Azure AI Content Understanding Client
 * Interacts with Azure AI Content Understanding layout & extraction models
 */

const axios = require('axios');
const createAzureCredential = require('./azureCredential');

class ContentUnderstandingClient {
  constructor(endpoint, credential) {
    this.endpoint = endpoint || process.env.AZURE_AI_SERVICES_ENDPOINT;
    this.credential = credential || createAzureCredential();
    this.apiVersion = '2024-12-01-preview';

    if (!this.endpoint) {
      throw new Error('AZURE_AI_SERVICES_ENDPOINT is required.');
    }
  }

  /**
   * Submit document buffer or URL to Content Understanding analyzer
   * @param {Buffer|string} fileInput - Binary file buffer or URL
   * @param {string} analyzerId - Analyzer name (e.g., 'purchase-order-layout-v1')
   */
  async analyzeDocument(fileInput, analyzerId = 'purchase-order-layout-v1') {
    const url = `${this.endpoint.replace(/\/$/, '')}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${this.apiVersion}`;
    const token = await this.credential.getToken('https://cognitiveservices.azure.com/.default');

    const headers = {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': Buffer.isBuffer(fileInput) ? 'application/octet-stream' : 'application/json'
    };

    const payload = Buffer.isBuffer(fileInput) ? fileInput : { url: fileInput };

    try {
      const response = await axios.post(url, payload, { headers, timeout: 30000 });
      return response.data;
    } catch (error) {
      throw new Error(`Content Understanding analysis failed: ${error.message}`, { cause: error });
    }
  }
}

module.exports = ContentUnderstandingClient;
