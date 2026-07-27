import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { cacheControl } from '../../cms/cache-control.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryIdParamSchema,
  publicCategoryQuerySchema,
  adminCategoryQuerySchema,
  createCourseSchema,
  updateCourseSchema,
  changeCourseStatusSchema,
  courseIdParamSchema,
  publicCourseQuerySchema,
  adminCourseQuerySchema,
  courseSlugParamSchema,
  assignInstructorSchema,
  removeInstructorSchema,
  setPrimaryInstructorSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  moduleIdParamSchema,
  courseModulesParamSchema,
  publicCourseModulesParamSchema,
} from '../../lms/lms.validation';
import { getPublicCategories, getPublicCourses, getPublicCourseDetail, getPublicCourseModules } from '../../lms/lms.controller';
import {
  postCategory,
  getCategoriesAdmin,
  getCategoryByIdAdmin,
  patchCategory,
  postReorderCategories,
  postArchiveCategory,
  postRestoreCategory,
  postCourse,
  getCoursesAdmin,
  getCourseByIdAdmin,
  patchCourse,
  postCourseStatus,
  postArchiveCourse,
  postRestoreCourse,
  postInstructor,
  getCourseInstructors,
  deleteInstructor,
  postInstructorPrimary,
  postModule,
  getCourseModules,
  getModuleById,
  patchModule,
  postReorderModules,
  postArchiveModule,
  postRestoreModule,
} from '../../lms/admin-lms.controller';
import {
  getMyInstructorCourses,
  getMyInstructorCourseById,
  patchMyInstructorCourse,
  postMyInstructorModule,
  getMyInstructorCourseModules,
  patchMyInstructorModule,
  postMyInstructorModuleReorder,
} from '../../lms/instructor-lms.controller';

/**
 * Phase 6 Part 1 — LMS course-engine/category/module routes. Mounted at
 * `/api/v1/lms` (same versioned-API convention as `/api/v1/cms`, `/api/v1/auth`
 * — see routes/v1/index.ts). Public reads live directly under `/lms/*`
 * (mirroring `/cms/pages/:slug`); admin writes under `/lms/admin/*`
 * (mirroring `/cms/admin/pages`); instructor-scoped routes under
 * `/lms/instructor/*` — a THIRD audience tier `/cms` doesn't need, since
 * CMS has no per-author-ownership concept the way LMS courses do.
 *
 * Endpoint-name note: the Phase 6 brief's own example paths use
 * `/api/admin/lms/...` / `/api/instructor/lms/...` / `/api/public/lms/...`
 * (no `/v1`, LMS as the outer segment). This repo's established, already-
 * approved convention (Phases 4–5) is `/api/v1/<module>/...` with the
 * module as the outer segment and the audience as an inner segment — see
 * docs/lms/API_REFERENCE_PART1.md for the explicit mapping.
 */
const router = Router();

// --- Public reads -----------------------------------------------------
router.get('/categories', cacheControl, validate(publicCategoryQuerySchema), getPublicCategories);
router.get('/courses', cacheControl, validate(publicCourseQuerySchema), getPublicCourses);
router.get('/courses/:slug', cacheControl, validate(courseSlugParamSchema), getPublicCourseDetail);
router.get('/courses/:slug/modules', cacheControl, validate(publicCourseModulesParamSchema), getPublicCourseModules);

// --- Admin: categories ---------------------------------------------------
const adminCategoryPermission = requirePermission('course.category.manage');
router.post('/admin/categories', authenticate, adminCategoryPermission, validate(createCategorySchema), postCategory);
router.get('/admin/categories', authenticate, adminCategoryPermission, validate(adminCategoryQuerySchema), getCategoriesAdmin);
router.get('/admin/categories/:id', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), getCategoryByIdAdmin);
router.patch('/admin/categories/:id', authenticate, adminCategoryPermission, validate(updateCategorySchema), patchCategory);
router.post('/admin/categories/reorder', authenticate, adminCategoryPermission, validate(reorderCategoriesSchema), postReorderCategories);
router.post('/admin/categories/:id/archive', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), postArchiveCategory);
router.post('/admin/categories/:id/restore', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), postRestoreCategory);

// --- Admin: courses -------------------------------------------------------
router.post('/admin/courses', authenticate, requirePermission('course.create'), validate(createCourseSchema), postCourse);
router.get('/admin/courses', authenticate, requirePermission('course.view'), validate(adminCourseQuerySchema), getCoursesAdmin);
router.get('/admin/courses/:id', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseByIdAdmin);
router.patch('/admin/courses/:id', authenticate, requirePermission('course.update'), validate(updateCourseSchema), patchCourse);
// course.update is the ROUTE-level baseline; postCourseStatus itself does a
// second, body-aware check requiring course.publish for PUBLISHED/SCHEDULED.
router.post('/admin/courses/:id/status', authenticate, requirePermission('course.update'), validate(changeCourseStatusSchema), postCourseStatus);
router.post('/admin/courses/:id/archive', authenticate, requirePermission('course.archive'), validate(courseIdParamSchema), postArchiveCourse);
router.post('/admin/courses/:id/restore', authenticate, requirePermission('course.archive'), validate(courseIdParamSchema), postRestoreCourse);

// --- Admin: instructor assignment -----------------------------------------
const manageInstructors = requirePermission('course.manageInstructors');
router.post('/admin/courses/:id/instructors', authenticate, manageInstructors, validate(assignInstructorSchema), postInstructor);
router.get('/admin/courses/:id/instructors', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseInstructors);
router.delete('/admin/courses/:id/instructors/:userId', authenticate, manageInstructors, validate(removeInstructorSchema), deleteInstructor);
router.post('/admin/courses/:id/instructors/:userId/primary', authenticate, manageInstructors, validate(setPrimaryInstructorSchema), postInstructorPrimary);

// --- Admin: modules ---------------------------------------------------
const manageModules = requirePermission('course.module.manage');
router.post('/admin/courses/:courseId/modules', authenticate, manageModules, validate(createModuleSchema), postModule);
router.get('/admin/courses/:courseId/modules', authenticate, requirePermission('course.view'), validate(courseModulesParamSchema), getCourseModules);
router.get('/admin/modules/:moduleId', authenticate, requirePermission('course.view'), validate(moduleIdParamSchema), getModuleById);
router.patch('/admin/modules/:moduleId', authenticate, manageModules, validate(updateModuleSchema), patchModule);
router.post('/admin/courses/:courseId/modules/reorder', authenticate, manageModules, validate(reorderModulesSchema), postReorderModules);
router.post('/admin/modules/:moduleId/archive', authenticate, manageModules, validate(moduleIdParamSchema), postArchiveModule);
router.post('/admin/modules/:moduleId/restore', authenticate, manageModules, validate(moduleIdParamSchema), postRestoreModule);

// --- Instructor-scoped ---------------------------------------------------
// course.update / course.module.manage are the permissions `course_instructor`
// actually holds (docs/lms/RBAC.md) — ownership (WHICH courses) is enforced
// inside the controller via assertInstructorOwnsCourse, not by RBAC alone.
router.get('/instructor/courses', authenticate, requirePermission('course.update'), getMyInstructorCourses);
router.get('/instructor/courses/:id', authenticate, requirePermission('course.update'), validate(courseIdParamSchema), getMyInstructorCourseById);
router.patch('/instructor/courses/:id', authenticate, requirePermission('course.update'), validate(updateCourseSchema), patchMyInstructorCourse);
router.post('/instructor/courses/:id/modules', authenticate, requirePermission('course.module.manage'), validate(createModuleSchema.extend({ params: courseIdParamSchema.shape.params })), postMyInstructorModule);
router.get('/instructor/courses/:id/modules', authenticate, requirePermission('course.module.manage'), validate(courseIdParamSchema), getMyInstructorCourseModules);
router.patch('/instructor/modules/:moduleId', authenticate, requirePermission('course.module.manage'), validate(updateModuleSchema), patchMyInstructorModule);
router.post('/instructor/courses/:id/modules/reorder', authenticate, requirePermission('course.module.manage'), validate(reorderModulesSchema.extend({ params: courseIdParamSchema.shape.params })), postMyInstructorModuleReorder);

export const lmsRouter = router;
