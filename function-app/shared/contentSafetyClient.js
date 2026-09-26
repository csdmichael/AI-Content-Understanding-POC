/**
 * Azure AI Content Safety In-Flight Guardrail Client
 * Implements Prompt Shield, Text Moderation, and PII protection
 */

const axios = require('axios');
const createAzureCredential = require('./azureCredential');

class ContentSafetyClient {
  constructor(endpoint, credential) {
    this.endpoint = endpoint || process.env.AZURE_CONTENT_SAFETY_ENDPOINT || process.env.AZURE_AI_SERVICES_ENDPOINT;
    this.credential = credential || createAzureCredential();
    this.apiVersion = '2024-09-01';

    if (!this.endpoint) {
      throw new Error('AZURE_CONTENT_SAFETY_ENDPOINT or AZURE_AI_SERVICES_ENDPOINT is required.');
    }
  }

  /**
   * Run Prompt Shield to detect user and document indirect prompt injections
   * @param {string} userPrompt - User prompt if any
   * @param {string[]} documents - Array of document text snippets extracted from files
   */
  async checkPromptShield(userPrompt, documents = []) {
    const url = `${this.endpoint.replace(/\/$/, '')}/contentsafety/text:shieldPrompt?api-version=${this.apiVersion}`;
    const token = await this.credential.getToken('https://cognitiveservices.azure.com/.default');

    const payload = {
      userPrompt: userPrompt || '',
      documents: documents
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (err) {
      throw new Error(`Prompt Shield analysis failed: ${err.message}`, { cause: err });
    }
  }

  /**
   * Run Text Moderation against standard harm categories (Hate, Self-Harm, Sexual, Violence)
   * @param {string} text - Text to analyze
   */
  async analyzeText(text) {
    const url = `${this.endpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2023-10-01`;
    const token = await this.credential.getToken('https://cognitiveservices.azure.com/.default');

    try {
      const response = await axios.post(url, { text }, {
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (err) {
      throw new Error(`Content Safety text analysis failed: ${err.message}`, { cause: err });
    }
  }
}

module.exports = ContentSafetyClient;
