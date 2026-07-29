import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  fileCaseSchema,
  paginationQuerySchema,
  actionCaseSchema,
  dismissCaseSchema,
  submitAppealSchema,
  resolveAppealSchema,
} from '../../trust-safety/trust-safety.validation';
import { postFileCase, postSubmitAppeal } from '../../trust-safety/trust-safety.controller';
import {
  getModerationQueue,
  postActionCase,
  postDismissCase,
  postResolveAppeal,
} from '../../trust-safety/moderation-admin.controller';

/** 001 FR-090/FR-092 — report/block/mute + appeal (every authenticated user, no special permission). */
const router = Router();
router.post('/cases', authenticate, validate(fileCaseSchema), postFileCase);
router.post('/cases/:caseId/appeal', authenticate, validate(submitAppealSchema), postSubmitAppeal);

export const trustSafetyRouter = router;

/** 001 FR-091/FR-092 — moderation queue/action/appeal-resolution (`community.moderate` — reused, not a parallel permission). */
const adminRouter = Router();
adminRouter.get('/cases', authenticate, requirePermission('community.moderate'), validate(paginationQuerySchema), getModerationQueue);
adminRouter.post('/cases/:caseId/action', authenticate, requirePermission('community.moderate'), validate(actionCaseSchema), postActionCase);
adminRouter.post('/cases/:caseId/dismiss', authenticate, requirePermission('community.moderate'), validate(dismissCaseSchema), postDismissCase);
adminRouter.post('/appeals/:appealId/resolve', authenticate, requirePermission('community.moderate'), validate(resolveAppealSchema), postResolveAppeal);

export const moderationAdminRouter = adminRouter;
