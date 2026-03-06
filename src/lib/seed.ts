import { v4 as uuidv4 } from 'uuid'
import {
  getCaseCount,
  insertCaseDirect,
  insertRequirementDirect,
  insertEvidenceDirect,
  insertAuditEventDirect,
} from './db'

export function seedDatabase() {
  const count = getCaseCount()
  if (count > 0) return { seeded: false, message: 'Data already exists' }

  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()

  // Case 1: WaitingForEvidence - Export case missing B/L
  const case1Id = 'case-001'
  insertCaseDirect({
    id: case1Id,
    title: 'LC案件 #2024-001 - 自動車部品輸出',
    case_type: 'Export',
    status: 'WaitingForEvidence',
    exporter: '田中商事株式会社',
    importer: 'ABC Motors Ltd.',
    description: 'L/C番号: LC-2024-US-001。自動車部品の対米輸出案件。船荷証券が未提出。',
    assigned_to: '山田 太郎',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    created_at: threeDaysAgo,
    updated_at: yesterday,
  })

  const req1_1 = uuidv4()
  const req1_2 = uuidv4()
  const req1_3 = uuidv4()
  const req1_4 = uuidv4()
  const req1_5 = uuidv4()

  insertRequirementDirect({ id: req1_1, case_id: case1Id, name: '船荷証券 (B/L)', description: 'オリジナル3通', status: 'Pending' })
  insertRequirementDirect({ id: req1_2, case_id: case1Id, name: '商業送り状', description: 'L/C条件に合致すること', status: 'Satisfied' })
  insertRequirementDirect({ id: req1_3, case_id: case1Id, name: 'パッキングリスト', description: '品番・数量を明記', status: 'Satisfied' })
  insertRequirementDirect({ id: req1_4, case_id: case1Id, name: '原産地証明書', description: 'Form A', status: 'Satisfied' })
  insertRequirementDirect({ id: req1_5, case_id: case1Id, name: '輸出許可証', description: '経済産業省発行', status: 'Satisfied' })

  const ev1_1 = uuidv4()
  insertEvidenceDirect({ id: ev1_1, requirement_id: req1_2, case_id: case1Id, document_type: '商業送り状', file_name: 'invoice_2024001.pdf', status: 'Verified', submitted_by: '田中 花子', submitted_at: twoDaysAgo, expiry_date: undefined, notes: 'L/C条件確認済み' })
  const ev1_2 = uuidv4()
  insertEvidenceDirect({ id: ev1_2, requirement_id: req1_3, case_id: case1Id, document_type: 'パッキングリスト', file_name: 'packing_2024001.pdf', status: 'Verified', submitted_by: '田中 花子', submitted_at: twoDaysAgo, expiry_date: undefined, notes: undefined })
  const ev1_3 = uuidv4()
  insertEvidenceDirect({ id: ev1_3, requirement_id: req1_4, case_id: case1Id, document_type: '原産地証明書', file_name: 'co_2024001.pdf', status: 'Received', submitted_by: '鈴木 一郎', submitted_at: yesterday, expiry_date: '2025-03-31', notes: 'Form A 確認済み' })
  const ev1_4 = uuidv4()
  insertEvidenceDirect({ id: ev1_4, requirement_id: req1_5, case_id: case1Id, document_type: '輸出許可証', file_name: 'export_license_2024001.pdf', status: 'Verified', submitted_by: '山田 太郎', submitted_at: threeDaysAgo, expiry_date: '2025-12-31', notes: undefined })

  insertAuditEventDirect({ id: uuidv4(), case_id: case1Id, event_type: 'CaseCreated', description: '案件が作成されました', actor: '山田 太郎', created_at: threeDaysAgo })
  insertAuditEventDirect({ id: uuidv4(), case_id: case1Id, event_type: 'StatusChanged', description: 'ステータスが IntakeValidated に変更されました', actor: '山田 太郎', created_at: twoDaysAgo })
  insertAuditEventDirect({ id: uuidv4(), case_id: case1Id, event_type: 'StatusChanged', description: 'ステータスが WaitingForEvidence に変更されました', actor: '山田 太郎', created_at: yesterday })
  insertAuditEventDirect({ id: uuidv4(), case_id: case1Id, event_type: 'EvidenceAdded', description: '証憑「商業送り状」が追加されました', actor: '田中 花子', created_at: twoDaysAgo })

  // Case 2: InReview - Import case
  const case2Id = 'case-002'
  insertCaseDirect({
    id: case2Id,
    title: 'LC案件 #2024-002 - 電子機器輸入',
    case_type: 'Import',
    status: 'InReview',
    exporter: 'TechGlobal Singapore Pte Ltd',
    importer: '佐藤電器株式会社',
    description: 'L/C番号: LC-2024-SG-015。電子基板の輸入案件。全書類提出済み、審査中。',
    assigned_to: '鈴木 恵子',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: yesterday,
  })

  const req2_1 = uuidv4()
  const req2_2 = uuidv4()
  const req2_3 = uuidv4()
  const req2_4 = uuidv4()
  const req2_5 = uuidv4()

  insertRequirementDirect({ id: req2_1, case_id: case2Id, name: '船荷証券 (B/L)', description: 'オリジナル3通', status: 'Satisfied' })
  insertRequirementDirect({ id: req2_2, case_id: case2Id, name: '商業送り状', description: 'L/C条件に合致すること', status: 'Satisfied' })
  insertRequirementDirect({ id: req2_3, case_id: case2Id, name: 'パッキングリスト', description: '品番・数量を明記', status: 'Satisfied' })
  insertRequirementDirect({ id: req2_4, case_id: case2Id, name: '輸入許可証', description: '税関発行', status: 'Satisfied' })
  insertRequirementDirect({ id: req2_5, case_id: case2Id, name: '税関申告書', description: 'B/C処理済み', status: 'Satisfied' })

  for (const [reqId, docType, fileName] of [
    [req2_1, '船荷証券', 'bl_2024002.pdf'],
    [req2_2, '商業送り状', 'invoice_2024002.pdf'],
    [req2_3, 'パッキングリスト', 'packing_2024002.pdf'],
    [req2_4, '輸入許可証', 'import_permit_2024002.pdf'],
    [req2_5, '税関申告書', 'customs_2024002.pdf'],
  ]) {
    insertEvidenceDirect({ id: uuidv4(), requirement_id: reqId as string, case_id: case2Id, document_type: docType as string, file_name: fileName as string, status: 'Verified', submitted_by: '鈴木 恵子', submitted_at: twoDaysAgo, expiry_date: undefined, notes: undefined })
  }

  insertAuditEventDirect({ id: uuidv4(), case_id: case2Id, event_type: 'CaseCreated', description: '案件が作成されました', actor: '鈴木 恵子', created_at: new Date(Date.now() - 7 * 86400000).toISOString() })
  insertAuditEventDirect({ id: uuidv4(), case_id: case2Id, event_type: 'StatusChanged', description: 'ステータスが InReview に変更されました', actor: '鈴木 恵子', created_at: yesterday })

  // Case 3: Exception - Export discrepancy
  const case3Id = 'case-003'
  insertCaseDirect({
    id: case3Id,
    title: 'LC案件 #2024-003 - 食品輸出（差異発生）',
    case_type: 'Export',
    status: 'Exception',
    exporter: '山本フーズ株式会社',
    importer: 'European Foods GmbH',
    description: 'L/C番号: LC-2024-DE-008。食品の対欧輸出案件。B/Lの港名がL/C条件と不一致。',
    assigned_to: '高橋 誠',
    due_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: now,
  })

  const req3_1 = uuidv4()
  const req3_2 = uuidv4()
  const req3_3 = uuidv4()
  const req3_4 = uuidv4()

  insertRequirementDirect({ id: req3_1, case_id: case3Id, name: '船荷証券 (B/L)', description: 'オリジナル3通', status: 'Rejected' })
  insertRequirementDirect({ id: req3_2, case_id: case3Id, name: '商業送り状', description: 'L/C条件に合致すること', status: 'Satisfied' })
  insertRequirementDirect({ id: req3_3, case_id: case3Id, name: 'パッキングリスト', description: '品番・数量を明記', status: 'Satisfied' })
  insertRequirementDirect({ id: req3_4, case_id: case3Id, name: '原産地証明書', description: 'EUR.1', status: 'Satisfied' })

  insertEvidenceDirect({ id: uuidv4(), requirement_id: req3_1, case_id: case3Id, document_type: '船荷証券', file_name: 'bl_2024003_v1.pdf', status: 'Rejected', submitted_by: '高橋 誠', submitted_at: threeDaysAgo, expiry_date: undefined, notes: '積地港がL/C条件（神戸港）と不一致（大阪港）。訂正B/L要求中。' })
  insertEvidenceDirect({ id: uuidv4(), requirement_id: req3_2, case_id: case3Id, document_type: '商業送り状', file_name: 'invoice_2024003.pdf', status: 'Verified', submitted_by: '高橋 誠', submitted_at: threeDaysAgo, expiry_date: undefined, notes: undefined })
  insertEvidenceDirect({ id: uuidv4(), requirement_id: req3_3, case_id: case3Id, document_type: 'パッキングリスト', file_name: 'packing_2024003.pdf', status: 'Verified', submitted_by: '高橋 誠', submitted_at: threeDaysAgo, expiry_date: undefined, notes: undefined })
  insertEvidenceDirect({ id: uuidv4(), requirement_id: req3_4, case_id: case3Id, document_type: '原産地証明書', file_name: 'eur1_2024003.pdf', status: 'Verified', submitted_by: '高橋 誠', submitted_at: twoDaysAgo, expiry_date: '2025-06-30', notes: 'EUR.1フォーム確認済み' })

  insertAuditEventDirect({ id: uuidv4(), case_id: case3Id, event_type: 'CaseCreated', description: '案件が作成されました', actor: '高橋 誠', created_at: new Date(Date.now() - 10 * 86400000).toISOString() })
  insertAuditEventDirect({ id: uuidv4(), case_id: case3Id, event_type: 'EvidenceRejected', description: '証憑「船荷証券」が却下されました: 積地港不一致', actor: '田中 部長', created_at: twoDaysAgo })
  insertAuditEventDirect({ id: uuidv4(), case_id: case3Id, event_type: 'StatusChanged', description: 'ステータスが Exception に変更されました: 差異処理が必要', actor: '田中 部長', created_at: yesterday })

  // Case 4: Approved
  const case4Id = 'case-004'
  insertCaseDirect({
    id: case4Id,
    title: 'LC案件 #2024-004 - 機械部品輸出（承認済）',
    case_type: 'Export',
    status: 'Approved',
    exporter: '松本機械株式会社',
    importer: 'Industrial Corp USA',
    description: 'L/C番号: LC-2024-US-002。全書類確認済み、承認完了。',
    assigned_to: '渡辺 美香',
    due_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: twoDaysAgo,
  })

  const req4_1 = uuidv4()
  const req4_2 = uuidv4()
  const req4_3 = uuidv4()
  const req4_4 = uuidv4()
  const req4_5 = uuidv4()

  insertRequirementDirect({ id: req4_1, case_id: case4Id, name: '船荷証券 (B/L)', description: 'オリジナル3通', status: 'Satisfied' })
  insertRequirementDirect({ id: req4_2, case_id: case4Id, name: '商業送り状', description: 'L/C条件に合致すること', status: 'Satisfied' })
  insertRequirementDirect({ id: req4_3, case_id: case4Id, name: 'パッキングリスト', description: '品番・数量を明記', status: 'Satisfied' })
  insertRequirementDirect({ id: req4_4, case_id: case4Id, name: '原産地証明書', description: 'Form A', status: 'Satisfied' })
  insertRequirementDirect({ id: req4_5, case_id: case4Id, name: '輸出許可証', description: '経済産業省発行', status: 'Satisfied' })

  for (const [reqId, docType, fileName] of [
    [req4_1, '船荷証券', 'bl_2024004.pdf'],
    [req4_2, '商業送り状', 'invoice_2024004.pdf'],
    [req4_3, 'パッキングリスト', 'packing_2024004.pdf'],
    [req4_4, '原産地証明書', 'co_2024004.pdf'],
    [req4_5, '輸出許可証', 'export_license_2024004.pdf'],
  ]) {
    insertEvidenceDirect({ id: uuidv4(), requirement_id: reqId as string, case_id: case4Id, document_type: docType as string, file_name: fileName as string, status: 'Verified', submitted_by: '渡辺 美香', submitted_at: new Date(Date.now() - 5 * 86400000).toISOString(), expiry_date: undefined, notes: undefined })
  }

  insertAuditEventDirect({ id: uuidv4(), case_id: case4Id, event_type: 'CaseCreated', description: '案件が作成されました', actor: '渡辺 美香', created_at: new Date(Date.now() - 14 * 86400000).toISOString() })
  insertAuditEventDirect({ id: uuidv4(), case_id: case4Id, event_type: 'DecisionMade', description: '案件が承認されました', actor: '田中 部長', created_at: twoDaysAgo })

  // Case 5: Draft
  const case5Id = 'case-005'
  insertCaseDirect({
    id: case5Id,
    title: 'LC案件 #2024-005 - 化学品輸入（新規）',
    case_type: 'Import',
    status: 'Draft',
    exporter: 'Chem Solutions Ltd.',
    importer: '伊藤化学株式会社',
    description: 'L/C番号: LC-2024-GB-003。化学原料の輸入案件。書類収集開始前。',
    assigned_to: '伊藤 健太',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    created_at: now,
    updated_at: now,
  })

  const req5_1 = uuidv4()
  const req5_2 = uuidv4()
  const req5_3 = uuidv4()
  const req5_4 = uuidv4()

  insertRequirementDirect({ id: req5_1, case_id: case5Id, name: '船荷証券 (B/L)', description: 'オリジナル3通', status: 'Pending' })
  insertRequirementDirect({ id: req5_2, case_id: case5Id, name: '商業送り状', description: 'L/C条件に合致すること', status: 'Pending' })
  insertRequirementDirect({ id: req5_3, case_id: case5Id, name: 'パッキングリスト', description: '品番・数量を明記', status: 'Pending' })
  insertRequirementDirect({ id: req5_4, case_id: case5Id, name: '輸入許可証', description: '税関発行', status: 'Pending' })

  insertAuditEventDirect({ id: uuidv4(), case_id: case5Id, event_type: 'CaseCreated', description: '案件が作成されました', actor: '伊藤 健太', created_at: now })

  return { seeded: true, message: 'Demo data seeded successfully' }
}
