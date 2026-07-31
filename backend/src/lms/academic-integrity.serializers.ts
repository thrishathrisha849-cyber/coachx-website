import type { AdminAcademicIntegrityCase } from './academic-integrity.types';

type CaseRow = {
  id: string;
  type: string;
  targetType: string;
  targetId: string | null;
  reportedUserId: string | null;
  reporterId: string | null;
  reason: string;
  evidence: unknown;
  status: string;
  actionReason: string | null;
  actionedBy: string | null;
  actionedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toAdminAcademicIntegrityCase(row: CaseRow): AdminAcademicIntegrityCase {
  return {
    id: row.id,
    type: row.type as AdminAcademicIntegrityCase['type'],
    targetType: row.targetType as AdminAcademicIntegrityCase['targetType'],
    targetId: row.targetId,
    reportedUserId: row.reportedUserId,
    reporterId: row.reporterId,
    reason: row.reason,
    evidence: row.evidence,
    status: row.status as AdminAcademicIntegrityCase['status'],
    actionReason: row.actionReason,
    actionedBy: row.actionedBy,
    actionedAt: row.actionedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
