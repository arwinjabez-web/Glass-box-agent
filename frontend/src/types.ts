export interface WebEvidenceItem {
  title: string;
  url: string;
  content: string;
}

export interface WebEvidence {
  query: string;
  results: WebEvidenceItem[];
  formatted_evidence: string;
}

export interface Requirement {
  field: string;
  operator: string;
  required_value: number | string;
  description: string;
}

export interface RequirementGroup {
  logic: "AND" | "OR" | string;
  requirements: Requirement[];
}

export interface ExtractedRequirements {
  target: string;
  groups: RequirementGroup[];
}

export interface MettaExpressionTrace {
  group_index: number;
  field: string;
  user_value: number | string | null;
  operator: string;
  required_value: number | string;
  expression: string;
  status: "PASS" | "FAIL" | "UNKNOWN" | string;
  description: string;
}

export interface MettaReasoning {
  expressions: MettaExpressionTrace[];
  atomspace_status: string;
}

export interface EvaluatedRequirement {
  status: "PASS" | "FAIL" | "UNKNOWN" | string;
  field: string;
  description: string;
  user_value: number | string | null;
  required: number | string;
  operator: string;
  expression: string;
}

export interface GroupEvaluation {
  group_index: number;
  logic: "AND" | "OR" | string;
  requirements: EvaluatedRequirement[];
}

export interface AnalysisResult {
  target: string;
  decision: "ELIGIBLE" | "NOT ELIGIBLE" | "CANNOT DETERMINE ELIGIBILITY" | string;
  concise_explanation: string;
  passed_reasons: string[];
  failed_reasons: string[];
  unknown_reasons: string[];
  user_values: Record<string, number | string>;
  web_evidence: WebEvidence;
  extracted_requirements: ExtractedRequirements;
  metta_reasoning: MettaReasoning;
  group_evaluations: GroupEvaluation[];
  _backend_source?: string;
  _engine?: string;
}

export interface BackendStatus {
  status: string;
  python_backend: {
    connected: boolean;
    url: string;
    latency_ms: number | null;
    details: any;
  };
  env_keys: {
    has_tavily: boolean;
    has_asi_cloud: boolean;
    has_gemini: boolean;
  };
  metta_reasoning_engine: string;
}
