/**
 * Automated Test Suite for Azure Content Understanding & Content Safety POC
 */

const assert = require('assert');
const http = require('http');

// Helper to make local HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting Test Suite for AI Content Understanding POC ===');

  // Start server on ephemeral port for tests
  process.env.PORT = '8099';
  const server = require('../server.js');
  
  // Wait 1.5s for server bind
  await new Promise(r => setTimeout(r, 1500));

  try {
    // 1. Health check test
    console.log('[TEST 1] Testing /api/v1/health endpoint...');
    const health = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/health',
      method: 'GET'
    });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'UP');
    assert.strictEqual(health.data.service, 'ai-content-understanding-poc');
    console.log('  -> Health check PASSED');

    // 2. Scenarios list test
    console.log('[TEST 2] Testing /api/v1/scenarios...');
    const scenarios = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/scenarios',
      method: 'GET'
    });
    assert.strictEqual(scenarios.status, 200);
    assert.ok(Array.isArray(scenarios.data));
    assert.strictEqual(scenarios.data.length, 6);
    console.log(`  -> Found ${scenarios.data.length} scenarios. PASSED`);

    // 3. Process Clean PO (Scenario 1)
    console.log('[TEST 3] Testing Clean PO processing (Scenario 1)...');
    const cleanPO = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/process-po',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { scenarioId: 'scenario-1' });
    assert.strictEqual(cleanPO.status, 200);
    assert.strictEqual(cleanPO.data.scenario.safety_scan.decision, 'APPROVED');
    assert.strictEqual(cleanPO.data.scenario.safety_scan.riskScore, 4);
    console.log('  -> Clean PO approved. PASSED');

    // 4. Process Prompt Injection PO (Scenario 3)
    console.log('[TEST 4] Testing Prompt Injection Guardrail (Scenario 3)...');
    const hostilePO = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/process-po',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { scenarioId: 'scenario-3' });
    assert.strictEqual(hostilePO.status, 200);
    assert.strictEqual(hostilePO.data.scenario.safety_scan.decision, 'BLOCKED');
    assert.strictEqual(hostilePO.data.scenario.safety_scan.promptShield.documentIndirectAttackDetected, true);
    console.log('  -> Adversarial injection blocked by Prompt Shield. PASSED');

    // 5. Process PII Leakage PO (Scenario 4)
    console.log('[TEST 5] Testing PII Guardrail (Scenario 4)...');
    const piiPO = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/process-po',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { scenarioId: 'scenario-4' });
    assert.strictEqual(piiPO.status, 200);
    assert.strictEqual(piiPO.data.scenario.safety_scan.decision, 'BLOCKED');
    assert.ok(piiPO.data.scenario.safety_scan.piiEntities.length > 0);
    console.log('  -> PII detected and blocked. PASSED');

    // 6. Test Large Context Chunker
    console.log('[TEST 6] Testing Large Context Chunking & Sliding Window...');
    const lc = await request({
      hostname: 'localhost',
      port: 8099,
      path: '/api/v1/guardrails/large-context',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: 'A'.repeat(2500) });
    assert.strictEqual(lc.status, 200);
    assert.ok(lc.data.totalChunks > 2);
    assert.strictEqual(lc.data.overlapTokens, 50);
    console.log(`  -> Large context processed with ${lc.data.totalChunks} chunks and 50-token overlap. PASSED`);

    console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTests();
