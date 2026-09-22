const fs = require('fs');
const path = require('path');

const scssContent = `
/* Top Navigation Header */
.top-nav-header {
  border-bottom: 1px solid var(--msft-gray-30);
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-toolbar {
  --background: #ffffff;
  --color: var(--msft-gray-160);
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 54px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  flex-wrap: wrap;
  padding: 6px 0;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.msft-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.msft-wordmark {
  font-size: 1.15rem;
  font-weight: 600;
  color: #242424;
  letter-spacing: -0.3px;
}

.brand-divider {
  width: 1px;
  height: 24px;
  background-color: var(--msft-gray-60);
}

.solution-title {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--msft-navy);
}

.poc-badge {
  font-size: 0.72rem;
  color: var(--msft-gray-130);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Viewport Controls */
.viewport-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid var(--msft-gray-30);
}

.control-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--msft-gray-130);
  text-transform: uppercase;
}

.btn-group {
  display: flex;
  gap: 4px;
}

.layout-btn {
  background: transparent;
  border: none;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--msft-gray-130);
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.layout-btn:hover {
  background: rgba(0, 120, 212, 0.08);
  color: var(--msft-blue);
}

.layout-btn.active {
  background: var(--msft-blue);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 120, 212, 0.3);
}

/* Header Links */
.header-links {
  display: flex;
  gap: 8px;
}

.nav-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--msft-gray-30);
  background: #ffffff;
  color: var(--msft-navy);
  transition: all 0.2s ease;
}

.nav-chip:hover {
  background: #f9fbfd;
  border-color: var(--msft-blue);
  color: var(--msft-blue);
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chip-dot.green { background-color: var(--msft-success); }
.chip-dot.blue { background-color: var(--msft-blue); }

/* Scenario Bar */
.scenario-bar {
  background: #f8f9fa;
  border-bottom: 1px solid var(--msft-gray-30);
  padding: 10px 16px;
}

.scenario-bar-inner {
  max-width: 1440px;
  margin: 0 auto;
}

.scenario-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.wf-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--msft-blue);
  text-transform: uppercase;
}

.wf-desc {
  font-size: 0.8rem;
  color: var(--msft-gray-130);
}

.scenario-pills {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.scenario-pill {
  flex: 0 0 auto;
  min-width: 170px;
  max-width: 210px;
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scenario-pill:hover {
  border-color: var(--msft-blue);
  box-shadow: 0 2px 6px rgba(0, 120, 212, 0.15);
}

.scenario-pill.active {
  border-color: var(--msft-blue);
  background: #f0f7ff;
  border-width: 2px;
  padding: 7px 9px;
  box-shadow: 0 2px 8px rgba(0, 120, 212, 0.2);
}

.pill-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.pill-po {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--msft-navy);
}

.pill-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-pass {
  background: #e6f4ea;
  color: #137333;
}

.badge-blocked {
  background: #fce8e6;
  color: #c5221f;
}

.badge-custom {
  background: #e8f0fe;
  color: #1a73e8;
}

.pill-title {
  font-size: 0.72rem;
  color: var(--msft-gray-130);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-label {
  cursor: pointer;
  display: block;
  margin: 0;
}

.hidden-input {
  display: none;
}

/* Main Layout Grid & Containers */
.main-content-scroll {
  --background: #f4f6f9;
}

.layout-container {
  max-width: 1480px;
  margin: 16px auto;
  padding: 0 16px;
}

/* Mode Auto: Native media query responsiveness */
.layout-container.mode-auto {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

@media (max-width: 1199px) {
  .layout-container.mode-auto {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .layout-container.mode-auto .col-guardrails {
    grid-column: span 2;
  }
}

@media (max-width: 767px) {
  .layout-container.mode-auto {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 70px; /* space for mobile nav */
  }
}

/* Mode Desktop: Forced 3 columns */
.layout-container.mode-desktop {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

/* Mode Tablet: Forced 2 columns */
.layout-container.mode-tablet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.layout-container.mode-tablet .col-guardrails {
  grid-column: span 2;
}

/* Mode Mobile: Forced 1 column */
.layout-container.mode-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 70px;
}

/* Cards & Panels */
.card {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid var(--msft-gray-30);
}

.panel-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-tag {
  background: var(--msft-blue);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.panel-header h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--msft-navy);
}

.download-link {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--msft-blue);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #c7e0f4;
  background: #f0f7ff;
}

.download-link:hover {
  background: #deecf9;
}

.model-badge, .guardrail-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: #e8f0fe;
  color: #1a73e8;
}

.guardrail-badge {
  background: #fef7e0;
  color: #b06000;
}

.panel-body {
  padding: 14px 16px;
}

/* Info Banner */
.info-banner {
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  padding: 3px 0;
}

.info-key {
  color: var(--msft-gray-130);
  font-weight: 500;
}

.info-val {
  color: var(--msft-navy);
}

.info-val.highlight {
  font-weight: 600;
  color: var(--msft-blue);
}

.code-val {
  font-size: 0.72rem;
}

.amount-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--msft-navy);
}

/* Parties Grid */
.parties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.party-box {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 8px 10px;
}

.party-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--msft-gray-130);
  margin-bottom: 4px;
}

.party-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--msft-navy);
}

.party-sub {
  font-size: 0.72rem;
  color: var(--msft-gray-130);
  margin-bottom: 4px;
}

.party-detail {
  font-size: 0.7rem;
  color: #484644;
  margin-bottom: 4px;
}

.party-id {
  font-size: 0.7rem;
  color: var(--msft-gray-130);
}

/* Items Section & Tables */
.section-subtitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--msft-navy);
  margin-bottom: 8px;
}

.count-tag {
  background: #f0f2f5;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--msft-gray-130);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.data-table th {
  background: #f8f9fa;
  color: var(--msft-gray-130);
  font-weight: 600;
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--msft-gray-30);
}

.data-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #323130;
}

.desc-cell {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-right { text-align: right; }
.bold { font-weight: 700; }

.table-more {
  text-align: center;
  font-size: 0.72rem;
  color: var(--msft-blue);
  font-weight: 600;
  padding: 6px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 4px;
}

/* Special Instructions Block */
.instructions-section {
  margin-top: 14px;
}

.instruction-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--msft-navy);
  margin-bottom: 6px;
}

.instruction-header.alert-header {
  color: var(--msft-danger);
}

.risk-badge {
  background: #fce8e6;
  color: var(--msft-danger);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.instruction-box {
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.75rem;
  color: #484644;
  line-height: 1.4;
  max-height: 120px;
  overflow-y: auto;
}

.instruction-box.box-danger {
  background: #fff5f5;
  border-color: #f5c2c7;
  color: #842029;
}

.action-btn-row {
  margin-top: 14px;
}

.btn {
  width: 100%;
  padding: 9px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--msft-blue);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #005a9e;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Pipeline Live Timeline */
.pipeline-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 8px 10px;
}

.step-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--msft-gray-60);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
}

.step-complete .step-icon {
  background: var(--msft-success);
}

.step-warn .step-icon {
  background: var(--msft-danger);
}

.step-info {
  flex: 1;
}

.step-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--msft-navy);
}

.step-sub {
  font-size: 0.68rem;
  color: var(--msft-gray-130);
}

.step-status {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
}

.status-ok {
  background: #e6f4ea;
  color: var(--msft-success);
}

.status-danger {
  background: #fce8e6;
  color: var(--msft-danger);
}

/* Extracted Fields Table */
.field-table tr.row-danger {
  background: #fff5f5;
}

.field-table tr.row-warn {
  background: #fff9e6;
}

.value-cell {
  max-width: 170px;
}

.field-security-note {
  font-size: 0.68rem;
  color: var(--msft-danger);
  font-weight: 600;
  margin-top: 2px;
}

.conf-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.conf-high { background: #e6f4ea; color: var(--msft-success); }
.conf-medium { background: #fff3cd; color: #856404; }
.conf-low { background: #fce8e6; color: var(--msft-danger); }

.source-cell {
  font-size: 0.7rem;
  color: var(--msft-gray-130);
}

.gate-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-clean { background: #e6f4ea; color: var(--msft-success); }
.tag-flagged { background: #fff3cd; color: #856404; }
.tag-quarantined { background: #fce8e6; color: var(--msft-danger); }

/* Log Console */
.event-stream {
  margin-top: 14px;
}

.log-console {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 10px;
  font-family: Consolas, monospace;
  font-size: 0.7rem;
  max-height: 140px;
  overflow-y: auto;
}

.log-line {
  color: #d4d4d4;
  margin-bottom: 4px;
  line-height: 1.3;
}

.log-time { color: #808080; }
.log-step { color: #569cd6; font-weight: 600; }
.log-msg { color: #ce9178; }
.log-dur { color: #4ec9b0; }

/* Decision Hero Banner */
.decision-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-left-width: 6px;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.decision-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--msft-gray-130);
  letter-spacing: 0.5px;
}

.decision-val {
  font-size: 1.4rem;
  font-weight: 800;
}

.decision-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 4px solid var(--msft-blue);
  display: flex;
  align-items: baseline;
  justify-content: center;
  background: #ffffff;
}

.score-num {
  font-size: 1.2rem;
  font-weight: 800;
}

.score-max {
  font-size: 0.65rem;
  color: var(--msft-gray-130);
}

.score-desc {
  font-size: 0.65rem;
  color: var(--msft-gray-130);
  margin-top: 2px;
}

.verdict-summary-box {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.76rem;
  color: #323130;
  margin-bottom: 12px;
}

/* Guardrail Cards */
.guardrail-card {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}

.guardrail-card.shield-active {
  border-color: var(--msft-danger);
  box-shadow: 0 2px 6px rgba(209, 52, 56, 0.15);
}

.guardrail-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fafbfc;
  border-bottom: 1px solid var(--msft-gray-30);
}

.guardrail-name {
  flex: 1;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--msft-navy);
}

.guardrail-title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ref-link {
  font-size: 0.7rem;
  color: var(--msft-blue);
  text-decoration: none;
  font-weight: 600;
}

.shield-verdict {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.verdict-good { background: #e6f4ea; color: var(--msft-success); }
.verdict-bad { background: #fce8e6; color: var(--msft-danger); }
.verdict-info { background: #e8f0fe; color: #1a73e8; }

.guardrail-card-body {
  padding: 10px;
}

.guardrail-desc {
  font-size: 0.72rem;
  color: var(--msft-gray-130);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.attack-details {
  background: #fff5f5;
  border: 1px solid #f5c2c7;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 0.72rem;
}

.attack-row {
  margin-bottom: 4px;
}

.attack-snippet {
  background: #1e1e1e;
  color: #ff8080;
  padding: 6px;
  border-radius: 4px;
  font-size: 0.68rem;
}

.text-danger { color: var(--msft-danger); }

/* PII List */
.pii-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pii-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 0.72rem;
}

.pii-type { font-weight: 600; color: #b78103; }
.pii-val { flex: 1; font-family: monospace; color: #212529; }
.pii-conf { font-size: 0.65rem; color: #795548; }

/* Blocklist Hits */
.blocklist-hits {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hit-item {
  background: #fff5f5;
  border: 1px solid #f5c2c7;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 0.72rem;
  color: var(--msft-danger);
  font-weight: 600;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cat-box {
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 4px;
  padding: 6px;
}

.cat-box.cat-alert {
  background: #fff5f5;
  border-color: #f5c2c7;
}

.cat-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.cat-bar-bg {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.cat-bar-fill {
  height: 100%;
  background: var(--msft-success);
  transition: width 0.3s ease;
}

.fill-danger { background: var(--msft-danger); }

.cat-status {
  font-size: 0.65rem;
  color: var(--msft-gray-130);
}

/* Large Context Chunks */
.chunks-container {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.chunk-pill {
  background: #f0f7ff;
  border: 1px solid #c7e0f4;
  border-radius: 4px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.68rem;
}

.chunk-pill.chunk-danger {
  background: #fce8e6;
  border-color: #fad2cf;
  color: var(--msft-danger);
  font-weight: 700;
}

.chunk-pill.chunk-warn {
  background: #fef7e0;
  border-color: #feefc3;
  color: #b06000;
}

.chunk-num { font-weight: 700; }
.chunk-tokens { font-size: 0.62rem; color: #5f6368; }

.aggregation-rule {
  font-size: 0.72rem;
  color: var(--msft-gray-130);
  background: #f8f9fa;
  padding: 6px 8px;
  border-radius: 4px;
}

/* Architectural Clarifications Section */
.arch-section {
  max-width: 1480px;
  margin: 20px auto;
  padding: 0 16px;
}

.arch-card {
  padding: 20px;
}

.arch-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.arch-header h2 {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--msft-navy);
}

.arch-subtitle {
  font-size: 0.85rem;
  color: var(--msft-gray-130);
  margin: 0 0 16px 0;
}

.arch-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--msft-gray-30);
  padding-bottom: 8px;
  overflow-x: auto;
}

.arch-tab-btn {
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--msft-gray-130);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.arch-tab-btn:hover {
  background: #f0f7ff;
  color: var(--msft-blue);
}

.arch-tab-btn.active {
  background: var(--msft-blue);
  color: #ffffff;
  border-color: var(--msft-blue);
}

.arch-body {
  padding-top: 16px;
}

.arch-content-panel h3 {
  margin: 0 0 10px 0;
  font-size: 1.05rem;
  color: var(--msft-navy);
}

.arch-content-panel p {
  font-size: 0.85rem;
  color: #484644;
  line-height: 1.5;
  margin-bottom: 14px;
}

/* Comparison Grid */
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 767px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

.comp-card {
  border: 1px solid var(--msft-gray-30);
  border-radius: 8px;
  padding: 14px;
  background: #fafbfc;
}

.cu-card {
  border-color: #c7e0f4;
  background: #f8fbfe;
}

.comp-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: #edebe9;
  color: var(--msft-gray-160);
  margin-bottom: 8px;
}

.cu-badge-active {
  background: #0078d4;
  color: #ffffff;
}

.comp-card h4 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: var(--msft-navy);
}

.comp-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 0.8rem;
  color: #323130;
  line-height: 1.5;
}

.comp-card li {
  margin-bottom: 6px;
}

/* Foundry Analysis */
.foundry-analysis-card {
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 8px;
  padding: 16px;
}

.analysis-status.ok {
  background: #e6f4ea;
  color: var(--msft-success);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 8px;
}

.foundry-analysis-card h4 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--msft-navy);
}

.deployment-models-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 14px;
}

@media (max-width: 767px) {
  .deployment-models-grid {
    grid-template-columns: 1fr;
  }
}

.dep-model-box {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 12px;
}

.dep-model-box h5 {
  margin: 0 0 6px 0;
  font-size: 0.85rem;
  color: var(--msft-blue);
}

.dep-model-box p {
  font-size: 0.78rem;
  margin: 0;
  line-height: 1.4;
}

/* Guardrail Flow Diagram */
.guardrail-workflow-diag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f8f9fa;
  border: 1px solid var(--msft-gray-30);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 14px;
  overflow-x: auto;
}

.diag-stage {
  flex: 1;
  min-width: 130px;
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.diag-stage.stage-highlight {
  border-color: var(--msft-blue);
  background: #f0f7ff;
}

.stage-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--msft-blue);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.diag-stage h5 {
  margin: 0 0 4px 0;
  font-size: 0.82rem;
  color: var(--msft-navy);
}

.diag-stage p {
  margin: 0;
  font-size: 0.7rem;
  color: var(--msft-gray-130);
}

.diag-arrow {
  font-size: 1.2rem;
}

.guardrail-benefits ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.82rem;
  line-height: 1.5;
}

.guardrail-benefits li {
  margin-bottom: 6px;
}

/* Large Context Grid */
.large-context-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 767px) {
  .large-context-grid {
    grid-template-columns: 1fr;
  }
}

.lc-card {
  background: #ffffff;
  border: 1px solid var(--msft-gray-30);
  border-radius: 6px;
  padding: 12px;
}

.lc-card h4 {
  margin: 0 0 6px 0;
  font-size: 0.85rem;
  color: var(--msft-navy);
}

.lc-card p {
  margin: 0;
  font-size: 0.78rem;
  color: #484644;
  line-height: 1.4;
}

.lc-ref-box {
  background: #f0f7ff;
  border: 1px solid #c7e0f4;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lc-ref-box a {
  font-weight: 600;
  color: var(--msft-blue);
}

/* Mobile Bottom Navigation Bar */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid var(--msft-gray-30);
  display: flex;
  justify-content: space-around;
  padding: 6px 0;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
}

.nav-tab-btn {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: var(--msft-gray-130);
  padding: 4px 12px;
  border-radius: 8px;
}

.nav-tab-btn.active {
  color: var(--msft-blue);
  font-weight: 700;
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-label {
  font-size: 0.68rem;
}

/* Global Footer */
.app-footer {
  background: var(--msft-navy);
  color: #ffffff;
  border-top: 1px solid #1a3a5e;
}

.footer-container {
  max-width: 1480px;
  margin: 0 auto;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.author-title {
  font-weight: 700;
  color: #ffffff;
}

.footer-dot {
  color: #8da4be;
}

.footer-sub {
  color: #b0c4de;
  font-size: 0.8rem;
}

.footer-right {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-link {
  color: #b0c4de;
  font-size: 0.78rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #ffffff;
  text-decoration: underline;
}
`;

const targetPath = path.join(__dirname, '..', 'frontend', 'src', 'app', 'app.scss');
fs.writeFileSync(targetPath, scssContent, 'utf8');
console.log('Successfully wrote app.scss to', targetPath);
