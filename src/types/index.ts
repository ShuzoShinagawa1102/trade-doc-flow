export type CaseStatus =
  | 'Draft'
  | 'IntakeValidated'
  | 'WaitingForEvidence'
  | 'InReview'
  | 'Approved'
  | 'Rejected'
  | 'Exception'
  | 'Closed'

export type CaseType = 'Export' | 'Import'

export type RequirementStatus = 'Pending' | 'Satisfied' | 'Rejected'

export type EvidenceStatus = 'Received' | 'Verified' | 'Rejected'

export type DecisionType = 'Approve' | 'Reject' | 'Escalate'

export interface Case {
  id: string
  title: string
  case_type: CaseType
  status: CaseStatus
  exporter: string | null
  importer: string | null
  description: string | null
  assigned_to: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  completeness_score?: number
}

export interface Requirement {
  id: string
  case_id: string
  name: string
  description: string | null
  status: RequirementStatus
  due_date: string | null
}

export interface Evidence {
  id: string
  requirement_id: string
  case_id: string
  document_type: string
  file_name: string | null
  status: EvidenceStatus
  submitted_by: string | null
  submitted_at: string
  expiry_date: string | null
  notes: string | null
}

export interface AuditEvent {
  id: string
  case_id: string
  event_type: string
  description: string
  actor: string
  created_at: string
}

export interface CaseDetail extends Case {
  requirements: (Requirement & { evidence: Evidence[] })[]
  audit_events: AuditEvent[]
  decision_recommendation: DecisionRecommendation
}

export interface DecisionRecommendation {
  recommendation: DecisionType
  reason: string
  missing_items: string[]
  completeness_score: number
}
