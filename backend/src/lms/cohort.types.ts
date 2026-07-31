export interface AdminCohort {
  id: string;
  courseId: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  timezone: string;
  capacity: number | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCohortMember {
  id: string;
  cohortId: string;
  userId: string;
  enrollmentId: string;
  joinedAt: Date;
}

export interface AdminCohortModuleSchedule {
  cohortId: string;
  moduleId: string;
  unlockAt: Date;
}
