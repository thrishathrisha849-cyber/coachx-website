import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  assignMemberSchema,
  paginationQuerySchema,
} from '../../organization/organization.validation';
import {
  postCreateOrganization,
  getOrganizationsAdmin,
  patchOrganization,
  postAssignMember,
  getOwnOrganizationMembersHandler,
} from '../../organization/organization-admin.controller';

/** 001 FR-053/FR-086 — Organization management (platform-wide, `organization.create`) and own-org scoping (`organization.manage_own`). */
const adminRouter = Router();
adminRouter.post('/', authenticate, requirePermission('organization.create'), validate(createOrganizationSchema), postCreateOrganization);
adminRouter.get('/', authenticate, requirePermission('organization.create'), validate(paginationQuerySchema), getOrganizationsAdmin);
adminRouter.patch('/:organizationId', authenticate, requirePermission('organization.create'), validate(updateOrganizationSchema), patchOrganization);
adminRouter.post('/:organizationId/members', authenticate, requirePermission('organization.create'), validate(assignMemberSchema), postAssignMember);

const ownScopeRouter = Router();
ownScopeRouter.get('/members', authenticate, requirePermission('organization.manage_own'), validate(paginationQuerySchema), getOwnOrganizationMembersHandler);

export const organizationAdminRouter = adminRouter;
export const organizationOwnScopeRouter = ownScopeRouter;
