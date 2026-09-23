export interface LineItem {
  pos: string;
  part_no: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  confidence?: number;
}

export interface SupplierInfo {
  name: string;
  division: string;
  address: string;
  city_state_zip: string;
  sap_vendor_id: string;
  contact: string;
}

export interface BuyerInfo {
  company: string;
  division: string;
  address: string;
  city_state_zip: string;
  sap_customer_id: string;
  buyer_name: string;
}

export interface PODetails {
  po_date: string;
  delivery_date: string;
  incoterms: string;
  payment_terms: string;
  currency: string;
  sap_doc_type: string;
  salesforce_opp_id: string;
}

export interface ExtractedField {
  fieldName: string;
  extractedValue: string;
  confidence: number;
  sourceLocation: string;
  safetyStatus: 'clean' | 'flagged' | 'quarantined';
  securityNote?: string;
}

export interface SafetyScanCategory {
  category: string;
  score: number; // 0 to 7
  threshold: number;
  status: 'SAFE' | 'WARNING' | 'BLOCKED';
  description: string;
}

export interface PromptShieldResult {
  userPromptAttackDetected: boolean;
  documentIndirectAttackDetected: boolean;
  attackType?: string;
  severityScore: number;
  snippet?: string;
}

export interface PIIEntity {
  type: string;
  valueMasked: string;
  confidence: number;
  offset: number;
  length: number;
}

export interface ChunkRiskItem {
  chunkIndex: number;
  tokenStart: number;
  tokenEnd: number;
  riskScore: number;
  detectedFlags: string[];
  snippet: string;
}

export interface LargeContextScan {
  totalTokens: number;
  chunkSize: number;
  overlapTokens: number;
  totalChunks: number;
  maxChunkRisk: number;
  aggregationStrategy: 'MAX_SEVERITY' | 'WEIGHTED_ROLLING_WINDOW' | 'MAJORITY_VOTE';
  chunkRisks: ChunkRiskItem[];
}

export interface SafetyScanResult {
  decision: 'APPROVED' | 'BLOCKED' | 'AUDIT_REQUIRED';
  riskScore: number; // 0 - 100
  overallVerdict: string;
  promptShield: PromptShieldResult;
  categories: SafetyScanCategory[];
  piiEntities: PIIEntity[];
  blocklistHits: string[];
  largeContextScan: LargeContextScan;
  processingTimeMs: number;
}

export interface PipelineExecutionLog {
  timestamp: string;
  step: string;
  status: 'pending' | 'running' | 'completed' | 'warning' | 'failed';
  details: string;
  durationMs?: number;
}

export interface Scenario {
  id: string;
  po_number: string;
  title: string;
  filename_base: string;
  pdf_file: string;
  json_file: string;
  txt_file: string;
  category: string;
  safety_expected: 'PASS' | 'BLOCKED';
  guardrail_flags: string[];
  risk_level: string;
  total: number;
  item_count: number;
  page_count?: number;
  supplier: SupplierInfo;
  buyer: BuyerInfo;
  po_details: PODetails;
  items: LineItem[];
  subtotal: number;
  tax: number;
  special_instructions: string;
  extracted_fields?: ExtractedField[];
  safety_scan?: SafetyScanResult;
  pipeline_logs?: PipelineExecutionLog[];
}
