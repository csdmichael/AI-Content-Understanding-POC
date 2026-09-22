import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { Scenario, ExtractedField, SafetyScanResult, PipelineExecutionLog } from './models/scenario.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  public title = 'Azure Content Understanding & Content Safety POC';
  public scenarios: Scenario[] = [];
  public selectedScenario: Scenario | null = null;
  public isProcessing = false;
  public pipelineLogs: PipelineExecutionLog[] = [];

  // Layout switcher: 'auto' | 'desktop' | 'tablet' | 'mobile'
  public layoutMode: 'auto' | 'desktop' | 'tablet' | 'mobile' = 'auto';

  // Navigation tab for tablet/mobile: 'ingest' | 'pipeline' | 'guardrails' | 'architecture'
  public activeMobileTab: 'ingest' | 'pipeline' | 'guardrails' | 'architecture' = 'ingest';

  // Architecture modal / view tab
  public activeArchTab: 'distinction' | 'foundry' | 'guardrails' | 'largeContext' = 'distinction';

  // Custom upload state
  public isCustomUpload = false;
  public customFileName = '';
  public customFileContent = '';

  // API docs / Swagger endpoint link
  public swaggerUrl = '/api-docs';
  public healthUrl = '/api/v1/health';

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.pipelineLogs$.subscribe(logs => this.pipelineLogs = logs);
    this.apiService.isProcessing$.subscribe(loading => this.isProcessing = loading);
    this.apiService.activeScenario$.subscribe(scenario => {
      if (scenario) {
        this.selectedScenario = scenario;
      }
    });

    this.loadScenarios();
  }

  public loadScenarios(): void {
    this.apiService.getScenarios().subscribe(scenarios => {
      this.scenarios = scenarios;
      if (scenarios.length > 0) {
        this.selectScenario(scenarios[0]);
      }
    });
  }

  public selectScenario(scenario: Scenario): void {
    this.isCustomUpload = false;
    this.selectedScenario = scenario;
    this.apiService.getScenarioById(scenario.id).subscribe(fullScenario => {
      this.selectedScenario = fullScenario;
      this.runPipeline();
    });
  }

  public runPipeline(): void {
    if (!this.selectedScenario) return;
    this.apiService.processPurchaseOrder(this.selectedScenario).subscribe(res => {
      this.selectedScenario = res;
    });
  }

  public handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isCustomUpload = true;
    this.customFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.customFileContent = e.target.result;
      const customScenario: Scenario = {
        id: 'custom-' + Date.now(),
        po_number: 'PO-CUSTOM-' + Math.floor(100000 + Math.random() * 900000),
        title: `Uploaded File: ${file.name}`,
        filename_base: file.name.replace(/\.[^/.]+$/, ""),
        pdf_file: file.name.endsWith('.pdf') ? file.name : 'PO-SAP-100482-Standard-Clean.pdf',
        json_file: 'PO-SAP-100482-Standard-Clean.json',
        txt_file: 'PO-SAP-100482-Standard-Clean.txt',
        category: 'Custom Uploaded Document',
        safety_expected: 'PASS',
        guardrail_flags: [],
        risk_level: 'Evaluating...',
        total: 12500.00,
        item_count: 2,
        supplier: {
          name: 'Apex Component Technologies Inc.',
          division: 'Client Custom Sourcing Division',
          address: '9200 Innovation Parkway, Suite 400',
          city_state_zip: 'Centennial, CO 80112 USA',
          sap_vendor_id: 'VEND-CUSTOM-01',
          contact: 'custom-orders@apex-components.corp'
        },
        buyer: {
          company: 'Enterprise Client Organization',
          division: 'Procurement & Supply Chain Management',
          address: '100 Global Way',
          city_state_zip: 'New York, NY 10001 USA',
          sap_customer_id: 'CUST-ENTERPRISE-01',
          buyer_name: 'Lead Sourcing Specialist'
        },
        po_details: {
          po_date: new Date().toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          incoterms: 'DDP - Client Warehouse',
          payment_terms: 'Net 30 Days Standard',
          currency: 'USD',
          sap_doc_type: 'NB - Standard PO',
          salesforce_opp_id: 'SF-CUSTOM-7788'
        },
        items: [
          { pos: '00010', part_no: 'CUST-ELEC-01', desc: 'Custom Procurement Line Item A', qty: 500, unit: 'EA', price: 15.00, total: 7500.00 },
          { pos: '00020', part_no: 'CUST-ELEC-02', desc: 'Custom Procurement Line Item B', qty: 1000, unit: 'EA', price: 5.00, total: 5000.00 }
        ],
        subtotal: 12500.00,
        tax: 0.00,
        special_instructions: typeof this.customFileContent === 'string' && this.customFileContent.length > 0 
          ? this.customFileContent.substring(0, 500) 
          : 'Standard fulfillment for custom uploaded procurement document.'
      };

      const lower = customScenario.special_instructions.toLowerCase();
      if (lower.includes('ignore') || lower.includes('override') || lower.includes('developer mode') || lower.includes('bypass')) {
        customScenario.safety_expected = 'BLOCKED';
        customScenario.guardrail_flags = ['Prompt-Shield', 'Indirect-Jailbreak'];
        customScenario.risk_level = 'Critical (7/7)';
      } else if (lower.includes('ssn') || lower.includes('credit card') || lower.includes('visa') || lower.includes('cvv')) {
        customScenario.safety_expected = 'BLOCKED';
        customScenario.guardrail_flags = ['PII-SSN-Detected', 'Credit-Card-Data'];
        customScenario.risk_level = 'High (5/7)';
      }

      this.selectedScenario = customScenario;
      this.runPipeline();
    };

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }

  public setLayout(mode: 'auto' | 'desktop' | 'tablet' | 'mobile'): void {
    this.layoutMode = mode;
  }

  public setMobileTab(tab: 'ingest' | 'pipeline' | 'guardrails' | 'architecture'): void {
    this.activeMobileTab = tab;
  }

  public setArchTab(tab: 'distinction' | 'foundry' | 'guardrails' | 'largeContext'): void {
    this.activeArchTab = tab;
  }

  public getDecisionColor(decision?: string): string {
    switch (decision) {
      case 'APPROVED': return '#107c41';
      case 'BLOCKED': return '#d13438';
      case 'AUDIT_REQUIRED': return '#d83b01';
      default: return '#0078d4';
    }
  }

  public getConfidenceBadgeClass(conf: number): string {
    if (conf >= 0.95) return 'conf-high';
    if (conf >= 0.85) return 'conf-medium';
    return 'conf-low';
  }
}

