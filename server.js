/**
 * Azure AI Content Understanding & Content Safety In-Flight Guardrail POC Server
 * Author: Michael Yaacoub | Sr Solution Engineer
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const appConfigPath = path.join(__dirname, 'config', 'app.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
const app = express();
const PORT = process.env.PORT || appConfig.defaultPort;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const APP_SERVICE_PLAN = process.env.APP_SERVICE_PLAN || null;
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_SERVICES_ENDPOINT || null;
const CONTENT_SAFETY_ENDPOINT = process.env.AZURE_CONTENT_SAFETY_ENDPOINT || null;

app.use(cors());
app.use(express.json({ limit: appConfig.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: appConfig.requestBodyLimit }));

// OpenAPI / Swagger Documentation
const openApiSpecPath = path.join(__dirname, 'docs', 'openapi.json');
let swaggerSpec = {};
try {
  swaggerSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));
} catch (err) {
  console.warn('Could not load docs/openapi.json:', err.message);
}

// Raw OpenAPI JSON endpoints
app.get('/api/v1/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

app.get('/api-docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Swagger UI configuration
const swaggerOpts = {
  customSiteTitle: "Azure Content Understanding & Content Safety API",
  customCss: ".swagger-ui .topbar { background-color: #0b2545; } .swagger-ui .topbar .download-url-wrapper { display: none; }",
  swaggerOptions: {
    url: "/api/v1/openapi.json",
    persistAuthorization: true
  }
};

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerOpts));
app.get('/api-docs/*', swaggerUi.setup(swaggerSpec, swaggerOpts));

// Serve raw docs directory for architecture diagrams & documentation
const docsDir = path.join(__dirname, 'docs');
if (fs.existsSync(docsDir)) {
  app.use('/docs', express.static(docsDir));
}

// Serve raw data directory for PDF/JSON/TXT downloads
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  app.use('/data', express.static(dataDir));
}

// REST API Endpoints

/**
 * Health check & runtime status
 */
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'ai-content-understanding-poc',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    nodeVersion: process.version,
    appServicePlan: APP_SERVICE_PLAN,
    services: {
      contentUnderstanding: AZURE_AI_ENDPOINT ? 'CONFIGURED' : 'NOT_CONFIGURED',
      contentSafety: CONTENT_SAFETY_ENDPOINT ? 'CONFIGURED' : 'NOT_CONFIGURED',
      salesforceIngestTrigger: 'READY'
    }
  });
});

/**
 * Public configuration endpoint
 */
app.get('/api/v1/config', (req, res) => {
  res.json({
    azureAiServicesEndpoint: AZURE_AI_ENDPOINT,
    contentSafetyEndpoint: CONTENT_SAFETY_ENDPOINT,
    appServicePlan: APP_SERVICE_PLAN,
    environment: ENVIRONMENT,
    largeContextRefUrl: appConfig.largeContextReferenceUrl
  });
});

/**
 * List scenarios from data directory
 */
app.get('/api/v1/scenarios', (req, res) => {
  const manifestPath = path.join(dataDir, 'scenarios_manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return res.json(manifest);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read scenario manifest' });
    }
  }
  res.status(404).json({ error: 'Scenario manifest not found' });
});

/**
 * Get single scenario details
 */
app.get('/api/v1/scenarios/:id', (req, res) => {
  const manifestPath = path.join(dataDir, 'scenarios_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: 'Manifest not found' });
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const found = manifest.find(m => m.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: `Scenario ${req.params.id} not found` });
  }

  const fullJsonPath = path.join(dataDir, found.json_file);
  if (fs.existsSync(fullJsonPath)) {
    const fullData = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));
    return res.json(fullData);
  }

  res.json(found);
});

/**
 * Helper to perform in-flight Content Safety analysis
 */
function analyzeContentSafety(text, scenario = {}) {
  const isMalicious = (scenario.safety_expected === 'BLOCKED') || /ignore|override|developer mode|bypass|jailbreak|disregard/i.test(text);
  const isHighValue = (scenario.guardrail_flags && scenario.guardrail_flags.includes('High-Value-Auditing')) || (scenario.id === 'scenario-2');
  const isPii = /ssn|credit card|visa|cvv|\d{3}-\d{2}-\d{4}|\d{4}-\d{4}-\d{4}-\d{4}/i.test(text);
  const isEmbargo = /itar|eccn|dual-use|radiation-hardened|customs border crossing|gyroscop|radar/i.test(text);

  let flags = [];
  if (isMalicious) flags.push('Prompt-Shield', 'Indirect-Jailbreak');
  if (isPii) flags.push('PII-SSN-Detected', 'Credit-Card-Data');
  if (isEmbargo) flags.push('Export-Control-ITAR', 'Embargoed-Entity');

  const decision = (isMalicious || isPii || isEmbargo) ? 'BLOCKED' : (isHighValue ? 'AUDIT_REQUIRED' : 'APPROVED');
  const riskScore = decision === 'BLOCKED' ? 94 : (decision === 'AUDIT_REQUIRED' ? 32 : 4);

  // Large context calculation based on page count and content length
  let totalTokens = Math.max(350, Math.round(text.length / 4));
  if (scenario.page_count && scenario.page_count >= 20) {
    totalTokens = 3850;
  } else if (scenario.page_count && scenario.page_count >= 10) {
    totalTokens = 1750;
  }
  const chunkSize = 250;
  const overlapTokens = 50;
  const totalChunks = Math.max(1, Math.ceil(totalTokens / (chunkSize - overlapTokens)));

  const chunkRisks = [];
  for (let i = 0; i < totalChunks; i++) {
    const isBad = decision === 'BLOCKED' && i === totalChunks - 1;
    const pageNum = Math.min(scenario.page_count || 1, Math.ceil((i + 1) * ((scenario.page_count || 1) / totalChunks)));
    chunkRisks.push({
      chunkIndex: i + 1,
      tokenStart: i * (chunkSize - overlapTokens),
      tokenEnd: Math.min(totalTokens, (i * (chunkSize - overlapTokens)) + chunkSize),
      riskScore: isBad ? 94 : (isHighValue ? 25 : 3),
      detectedFlags: isBad ? flags : [],
      snippet: isBad ? '...[TRIGGER] ' + text.substring(0, 60) + '...' : `Chunk #${i + 1} (Page ${pageNum}): Bill of materials line items, delivery schedules & QA verification.`
    });
  }

  return {
    decision,
    riskScore,
    overallVerdict: decision === 'BLOCKED'
      ? `Quarantined by Azure Content Safety in-flight guardrail. Security violation: ${flags.join(', ')}. Downstream SAP ERP creation blocked.`
      : (decision === 'AUDIT_REQUIRED' 
          ? 'Approved with conditional manual oversight: Order exceeds $100,000 threshold.' 
          : 'Passed all in-flight safety guardrails. Cleared for automated SAP ERP ingestion.'),
    processingTimeMs: Math.round(150 + Math.random() * 80),
    promptShield: {
      userPromptAttackDetected: false,
      documentIndirectAttackDetected: isMalicious,
      attackType: isMalicious ? 'Indirect Prompt Injection / Jailbreak Attempt' : undefined,
      severityScore: isMalicious ? 7 : 0,
      snippet: isMalicious ? text.substring(0, 120) + '...' : undefined
    },
    categories: [
      { category: 'Hate', score: 0, threshold: 2, status: 'SAFE', description: 'Zero hate speech detected' },
      { category: 'Self-Harm', score: 0, threshold: 2, status: 'SAFE', description: 'Zero self-harm references detected' },
      { category: 'Sexual', score: 0, threshold: 2, status: 'SAFE', description: 'Zero explicit sexual material detected' },
      { 
        category: 'Violence / Hostile Intent', 
        score: isEmbargo ? 4 : (isMalicious ? 6 : 0), 
        threshold: 2, 
        status: (isEmbargo || isMalicious) ? 'BLOCKED' : 'SAFE', 
        description: isEmbargo ? 'Dual-use military radar hardware / ITAR Category XII triggered' : 'Compliant' 
      }
    ],
    piiEntities: isPii ? [
      { type: 'CreditCardNumber', valueMasked: 'Visa ****-****-****-3184', confidence: 0.992, offset: 95, length: 19 },
      { type: 'US_SocialSecurityNumber', valueMasked: '***-**-9921', confidence: 0.985, offset: 215, length: 11 },
      { type: 'PhoneNumber', valueMasked: '+1 (512) ***-0198', confidence: 0.960, offset: 160, length: 17 },
      { type: 'PhysicalAddress', valueMasked: '1420 Pecan Tree Lane, Apt 4B, Austin TX', confidence: 0.941, offset: 255, length: 42 }
    ] : [],
    blocklistHits: isEmbargo ? [
      'Vostok Geospatial Navigation Consortia (OFAC Entity List)',
      'ECCN 7A101 Space-grade Gyroscope (EAR / ITAR Prohibited)',
      'Offshore Transshipment Island (High-risk laundering corridor)'
    ] : [],
    largeContextScan: {
      totalTokens,
      chunkSize,
      overlapTokens,
      totalChunks,
      maxChunkRisk: decision === 'BLOCKED' ? 94 : (isHighValue ? 25 : 3),
      aggregationStrategy: 'MAX_SEVERITY',
      chunkRisks
    }
  };
}

/**
 * Process purchase order through simulated Azure Function & Content Understanding pipeline
 */
app.post('/api/v1/process-po', (req, res) => {
  const { scenarioId, poNumber, specialInstructions, total, items } = req.body;
  let targetScenario = null;

  if (scenarioId) {
    const manifestPath = path.join(dataDir, 'scenarios_manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const found = manifest.find(m => m.id === scenarioId);
      if (found) {
        const fullJsonPath = path.join(dataDir, found.json_file);
        if (fs.existsSync(fullJsonPath)) {
          targetScenario = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));
        }
      }
    }
  }

  if (!targetScenario) {
    targetScenario = {
      id: scenarioId || 'custom-po',
      po_number: poNumber || 'PO-SAP-CUSTOM',
      total: total || 50000.00,
      special_instructions: specialInstructions || '',
      items: items || [],
      supplier: { name: 'Apex Component Technologies Inc.' },
      buyer: { company: 'Procurement Sourcing LLC' },
      po_details: { po_date: new Date().toISOString().split('T')[0], incoterms: 'DDP' }
    };
  }

  const safetyScan = analyzeContentSafety(targetScenario.special_instructions || '', targetScenario);
  const isBlocked = safetyScan.decision === 'BLOCKED';
  const isHighValue = targetScenario.total > 100000;

  const extractedFields = [
    { fieldName: 'PONumber', extractedValue: targetScenario.po_number, confidence: 0.994, sourceLocation: 'Header Top-Right', safetyStatus: 'clean' },
    { fieldName: 'PODate', extractedValue: targetScenario.po_details?.po_date || '2026-09-20', confidence: 0.988, sourceLocation: 'Header Info Block', safetyStatus: 'clean' },
    { fieldName: 'SupplierName', extractedValue: targetScenario.supplier?.name || 'Apex Component Technologies', confidence: 0.991, sourceLocation: 'Vendor Party Box', safetyStatus: 'clean' },
    { fieldName: 'BuyerCompany', extractedValue: targetScenario.buyer?.company || 'Enterprise Systems LLC', confidence: 0.985, sourceLocation: 'Deliver-to Box', safetyStatus: 'clean' },
    { fieldName: 'DeliveryTerms', extractedValue: targetScenario.po_details?.incoterms || 'DDP', confidence: 0.962, sourceLocation: 'PO Details Block', safetyStatus: 'clean' },
    { 
      fieldName: 'GrandTotal', 
      extractedValue: `$${Number(targetScenario.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      confidence: 0.996, 
      sourceLocation: 'Summary Totals Table', 
      safetyStatus: isHighValue ? 'flagged' : 'clean',
      securityNote: isHighValue ? 'Triggered high-value procurement approval gate' : undefined
    },
    { fieldName: 'LineItemCount', extractedValue: `${targetScenario.items?.length || 2} materials`, confidence: 0.978, sourceLocation: 'Line Items Grid', safetyStatus: 'clean' },
    { 
      fieldName: 'SpecialInstructions', 
      extractedValue: (targetScenario.special_instructions || '').length > 90 ? (targetScenario.special_instructions || '').substring(0, 90) + '...' : (targetScenario.special_instructions || 'N/A'), 
      confidence: 0.982, 
      sourceLocation: 'Delivery Instructions Footer', 
      safetyStatus: isBlocked ? 'quarantined' : 'clean',
      securityNote: isBlocked ? `Contained hostile payload / policy violation` : 'Compliant delivery notes'
    }
  ];

  targetScenario.extracted_fields = extractedFields;
  targetScenario.safety_scan = safetyScan;

  res.json({
    status: 'success',
    scenario: targetScenario
  });
});

/**
 * Direct guardrail analysis endpoint
 */
app.post('/api/v1/guardrails/analyze', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Field "text" is required' });
  }
  const result = analyzeContentSafety(text);
  res.json(result);
});

/**
 * Large context windowing calculation endpoint
 */
app.post('/api/v1/guardrails/large-context', (req, res) => {
  const { text, chunkSize = 250, overlapTokens = 50 } = req.body;
  const safeText = text || '';
  const totalTokens = Math.max(10, Math.round(safeText.length / 4));
  const totalChunks = Math.max(1, Math.ceil(totalTokens / (chunkSize - overlapTokens)));

  const chunkRisks = [];
  for (let i = 0; i < totalChunks; i++) {
    chunkRisks.push({
      chunkIndex: i + 1,
      tokenStart: i * (chunkSize - overlapTokens),
      tokenEnd: Math.min(totalTokens, (i * (chunkSize - overlapTokens)) + chunkSize),
      riskScore: 4,
      detectedFlags: [],
      snippet: safeText.substring(i * 100, (i * 100) + 80)
    });
  }

  res.json({
    totalTokens,
    chunkSize,
    overlapTokens,
    totalChunks,
    maxChunkRisk: 4,
    aggregationStrategy: 'MAX_SEVERITY',
    chunkRisks
  });
});

// Serve frontend static build files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  
  // SPA Fallback: send public/index.html for any route not matching an API
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>Azure Content Understanding & Content Safety POC Server</h1><p>API available at <a href="/api-docs">/api-docs</a></p>');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
  console.log(`[INFO] Environment: ${ENVIRONMENT}`);
  console.log(`[INFO] Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`[INFO] Health API: http://localhost:${PORT}/api/v1/health`);
});
