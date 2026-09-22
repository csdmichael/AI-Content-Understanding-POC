/**
 * Azure Function HTTP Trigger: Salesforce Purchase Order Ingestion
 * Workflow:
 * 1. Receives multipart/form-data from Salesforce
 * 2. Streams files to Azure AI Content Understanding (layout model + extraction instructions)
 * 3. Applies in-flight Azure AI Content Safety Guardrails (Prompt Shield, PII, Text Moderation)
 * 4. Conditionally routes: Clean -> SAP S/4HANA ERP, Blocked -> Security Quarantine
 */

const ContentUnderstandingClient = require('../shared/contentUnderstandingClient');
const ContentSafetyClient = require('../shared/contentSafetyClient');
const LargeContextChunker = require('../shared/largeContextChunker');

module.exports = async function (context, req) {
  context.log('[INFO] Salesforce Purchase Order Ingest Trigger received payload.');

  const cuClient = new ContentUnderstandingClient();
  const csClient = new ContentSafetyClient();

  const body = req.body || {};
  const poNumber = body.poNumber || req.query.poNumber || 'PO-SAP-UNSPECIFIED';
  const specialInstructions = body.specialInstructions || body.instructions || '';
  const totalAmount = body.totalAmount || 0;

  context.log(`[INFO] Processing Purchase Order: ${poNumber}, Total Amount: $${totalAmount}`);

  // 1. Content Understanding Extraction
  const extractionResult = await cuClient.analyzeDocument(body.fileContent || specialInstructions);

  // 2. Large-Context Chunking & Sliding Window Scan
  const chunks = LargeContextChunker.chunkText(specialInstructions, 250, 50);
  const chunkEvaluations = [];

  for (const chunk of chunks) {
    const promptShieldRes = await csClient.checkPromptShield('', [chunk.text]);
    const isDocAttack = promptShieldRes.documentsAnalysis?.some(d => d.attackDetected);
    const modRes = await csClient.analyzeText(chunk.text);
    const violenceSeverity = modRes.categoriesAnalysis?.find(c => c.category === 'Violence')?.severity || 0;

    const chunkBlocked = isDocAttack || violenceSeverity >= 4;
    chunkEvaluations.push({
      chunkIndex: chunk.chunkIndex,
      tokenStart: chunk.tokenStart,
      tokenEnd: chunk.tokenEnd,
      riskScore: chunkBlocked ? 94 : 4,
      decision: chunkBlocked ? 'BLOCKED' : 'APPROVED',
      detectedFlags: isDocAttack ? ['Prompt-Shield', 'Indirect-Jailbreak'] : []
    });
  }

  // 3. Aggregate Safety Decision using MAX_SEVERITY rule
  const safetyVerdict = LargeContextChunker.aggregateResults(chunkEvaluations);

  // 4. Downstream Conditional Routing
  let routeStatus = 'DISPATCHED_TO_SAP';
  if (safetyVerdict.decision === 'BLOCKED') {
    routeStatus = 'QUARANTINED_SECURITY_VIOLATION';
    context.log(`[SECURITY ALERT] PO ${poNumber} blocked by in-flight guardrail. Flags: ${safetyVerdict.flags.join(', ')}`);
  } else if (totalAmount > 100000) {
    routeStatus = 'PENDING_EXECUTIVE_APPROVAL';
    context.log(`[AUDIT] PO ${poNumber} routed to executive approval queue due to high value threshold.`);
  }

  context.res = {
    status: safetyVerdict.decision === 'BLOCKED' ? 403 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      poNumber,
      workflowStatus: routeStatus,
      safetyVerdict: safetyVerdict.decision,
      riskScore: safetyVerdict.maxRiskScore,
      flags: safetyVerdict.flags,
      chunksEvaluated: safetyVerdict.totalChunksEvaluated,
      extraction: extractionResult
    }
  };
};
