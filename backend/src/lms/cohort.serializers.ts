import type { AdminCohort, AdminCohortMember, AdminCohortModuleSchedule } from './cohort.types';

type CohortRow = {
  id: string;
  courseId: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  timezone: string;
  capacity: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toAdminCohort(row: CohortRow, memberCount?: number): AdminCohort {
  return {
    id: row.id,
    courseId: row.courseId,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    timezone: row.timezone,
    capacity: row.capacity,
    status: row.status as AdminCohort['status'],
    ...(memberCount !== undefined ? { memberCount } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type CohortMemberRow = { id: string; cohortId: string; userId: string; enrollmentId: string; joinedAt: Date };

export function toAdminCohortMember(row: CohortMemberRow): AdminCohortMember {
  return { id: row.id, cohortId: row.cohortId, userId: row.userId, enrollmentId: row.enrollmentId, joinedAt: row.joinedAt };
}

type CohortModuleScheduleRow = { cohortId: string; moduleId: string; unlockAt: Date };

export function toAdminCohortModuleSchedule(row: CohortModuleScheduleRow): AdminCohortModuleSchedule {
  return { cohortId: row.cohortId, moduleId: row.moduleId, unlockAt: row.unlockAt };
}
