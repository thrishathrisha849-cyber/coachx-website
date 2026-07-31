import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { createCourse as createCourseRow, findCourseById } from './course.repository';
import { toAdminCourse } from './lms.serializers';
import type { AdminCourse } from './lms.types';
import type { TransactionClient } from '../database/transaction';

/**
 * 004 US8 Course Cloning batch — FR-098's six named clone modes. Every mode
 * produces a brand-new, independent `Course` row (own id/slug, status reset
 * to DRAFT) with ZERO carry-over of enrollments/progress/financial data —
 * this codebase never stores per-course financial history on the Course
 * row itself (Volume 09 owns that), and no Enrollment/LessonProgress/
 * QuizAttempt/Submission row is ever read or copied by this service, so
 * SC-008's "0% carry-over" guarantee holds structurally, not by convention.
 *
 * `ASSESSMENT_BANK` is handled separately from the other five modes (see
 * `cloneAssessmentBankOnly` below) — it copies `QuestionBankItem` template
 * rows rather than curriculum/lessons, so it doesn't fit `MODE_COPIES`'
 * curriculum/activities/assessments/instructors/certificateSettings shape.
 */
export type CourseCloneMode = 'FULL' | 'CURRICULUM_ONLY' | 'CONTENT_WITHOUT_ENROLLMENTS' | 'ASSESSMENT_BANK' | 'CERTIFICATE_SETTINGS' | 'TRANSLATION_VARIANT';

export interface CloneCourseInput {
  mode: CourseCloneMode;
  slug: string;
  title?: string;
  /** Only meaningful for TRANSLATION_VARIANT — the new variant's target language. Defaults to the source's language if omitted. */
  language?: 'EN' | 'TA' | 'TANGLISH';
}

/** Which content categories each mode carries over — the single source of truth every branch below reads from, so the mode/behavior mapping lives in one place. */
const MODE_COPIES: Record<Exclude<CourseCloneMode, 'ASSESSMENT_BANK'>, { curriculum: boolean; activities: boolean; assessments: boolean; instructors: boolean; certificateSettings: boolean }> = {
  FULL: { curriculum: true, activities: true, assessments: true, instructors: true, certificateSettings: true },
  CURRICULUM_ONLY: { curriculum: true, activities: false, assessments: false, instructors: false, certificateSettings: false },
  CONTENT_WITHOUT_ENROLLMENTS: { curriculum: true, activities: true, assessments: true, instructors: false, certificateSettings: true },
  CERTIFICATE_SETTINGS: { curriculum: false, activities: false, assessments: false, instructors: false, certificateSettings: true },
  TRANSLATION_VARIANT: { curriculum: true, activities: true, assessments: true, instructors: true, certificateSettings: true },
};

async function cloneModulesLessonsAndContent(
  tx: TransactionClient,
  sourceCourseId: string,
  newCourseId: string,
  copies: { activities: boolean; assessments: boolean },
): Promise<void> {
  const modules = await tx.courseModule.findMany({
    where: { courseId: sourceCourseId, status: { not: 'ARCHIVED' } },
    orderBy: { position: 'asc' },
    include: {
      lessons: {
        where: { deletedAt: null, status: { not: 'ARCHIVED' } },
        orderBy: { position: 'asc' },
        include: {
          activities: { where: { deletedAt: null, status: { not: 'ARCHIVED' } }, orderBy: { position: 'asc' } },
          quiz: { include: { questions: { where: { deletedAt: null }, orderBy: { position: 'asc' }, include: { options: { orderBy: { position: 'asc' } } } } } },
          assignment: { include: { rubricCriteria: { where: { deletedAt: null }, orderBy: { position: 'asc' } } } },
        },
      },
    },
  });

  const moduleIdMap = new Map<string, string>();

  for (const sourceModule of modules) {
    const newModule = await tx.courseModule.create({
      data: {
        course: { connect: { id: newCourseId } },
        title: sourceModule.title,
        description: sourceModule.description,
        outcome: sourceModule.outcome,
        position: sourceModule.position,
        estimatedDurationMinutes: sourceModule.estimatedDurationMinutes,
        isMandatory: sourceModule.isMandatory,
        isPreview: sourceModule.isPreview,
        releaseRuleType: sourceModule.releaseRuleType,
        releaseRuleValue: sourceModule.releaseRuleValue ?? undefined,
        completionRuleType: sourceModule.completionRuleType,
        status: 'DRAFT',
      },
    });
    moduleIdMap.set(sourceModule.id, newModule.id);

    for (const sourceLesson of sourceModule.lessons) {
      const newLesson = await tx.lesson.create({
        data: {
          module: { connect: { id: newModule.id } },
          title: sourceLesson.title,
          slug: sourceLesson.slug,
          summary: sourceLesson.summary,
          description: sourceLesson.description,
          position: sourceLesson.position,
          durationMinutes: sourceLesson.durationMinutes,
          isPreview: sourceLesson.isPreview,
          isMandatory: sourceLesson.isMandatory,
          completionRuleType: sourceLesson.completionRuleType,
          completionRuleTypes: sourceLesson.completionRuleTypes,
          completionRuleValue: sourceLesson.completionRuleValue ?? undefined,
          status: 'DRAFT',
        },
      });

      if (copies.activities) {
        for (const activity of sourceLesson.activities) {
          await tx.learningActivity.create({
            data: {
              lesson: { connect: { id: newLesson.id } },
              type: activity.type,
              title: activity.title,
              position: activity.position,
              mediaUrl: activity.mediaUrl,
              externalUrl: activity.externalUrl,
              bodyText: activity.bodyText,
              durationSeconds: activity.durationSeconds,
              fileSizeBytes: activity.fileSizeBytes,
              embedProvider: activity.embedProvider,
              embedResourceId: activity.embedResourceId,
              status: 'DRAFT',
            },
          });
        }
      }

      if (copies.assessments && sourceLesson.quiz) {
        const newQuiz = await tx.quiz.create({
          data: {
            lesson: { connect: { id: newLesson.id } },
            title: sourceLesson.quiz.title,
            instructions: sourceLesson.quiz.instructions,
            quizType: sourceLesson.quiz.quizType,
            passingScorePercent: sourceLesson.quiz.passingScorePercent,
            maxAttempts: sourceLesson.quiz.maxAttempts,
            timeLimitMinutes: sourceLesson.quiz.timeLimitMinutes,
            randomizeQuestions: sourceLesson.quiz.randomizeQuestions,
            randomizeAnswers: sourceLesson.quiz.randomizeAnswers,
            showCorrectAnswers: sourceLesson.quiz.showCorrectAnswers,
            status: 'DRAFT',
          },
        });

        for (const question of sourceLesson.quiz.questions) {
          const newQuestion = await tx.question.create({
            data: {
              quiz: { connect: { id: newQuiz.id } },
              type: question.type,
              prompt: question.prompt,
              explanation: question.explanation,
              points: question.points,
              position: question.position,
              answerKey: question.answerKey ?? undefined,
              status: question.status,
            },
          });

          for (const option of question.options) {
            await tx.questionOption.create({
              data: {
                question: { connect: { id: newQuestion.id } },
                text: option.text,
                isCorrect: option.isCorrect,
                position: option.position,
              },
            });
          }
        }
      }

      if (copies.assessments && sourceLesson.assignment) {
        const newAssignment = await tx.assignment.create({
          data: {
            lesson: { connect: { id: newLesson.id } },
            title: sourceLesson.assignment.title,
            instructions: sourceLesson.assignment.instructions,
            learningOutcome: sourceLesson.assignment.learningOutcome,
            submissionFormat: sourceLesson.assignment.submissionFormat,
            allowedFileTypes: sourceLesson.assignment.allowedFileTypes,
            // Deliberately NOT copied: a due date from the source course run
            // is meaningless for a brand-new course/cohort — the admin sets
            // a fresh one after cloning.
            dueAt: null,
            maxScore: sourceLesson.assignment.maxScore,
            passingScore: sourceLesson.assignment.passingScore,
            latePolicy: sourceLesson.assignment.latePolicy,
            maxAttempts: sourceLesson.assignment.maxAttempts,
            status: 'DRAFT',
          },
        });

        for (const criterion of sourceLesson.assignment.rubricCriteria) {
          await tx.rubricCriterion.create({
            data: {
              assignment: { connect: { id: newAssignment.id } },
              title: criterion.title,
              description: criterion.description,
              maxPoints: criterion.maxPoints,
              position: criterion.position,
            },
          });
        }
      }
    }
  }

  // Second pass: remap prerequisiteModuleId now that every module's new id is known.
  // A prerequisite pointing at an archived (not cloned) module is dropped rather than left dangling.
  for (const sourceModule of modules) {
    if (!sourceModule.prerequisiteModuleId) continue;
    const newPrerequisiteId = moduleIdMap.get(sourceModule.prerequisiteModuleId);
    if (!newPrerequisiteId) continue;
    const newModuleId = moduleIdMap.get(sourceModule.id);
    if (!newModuleId) continue;
    await tx.courseModule.update({ where: { id: newModuleId }, data: { prerequisiteModuleId: newPrerequisiteId } });
  }
}

/**
 * FR-098 acceptance scenario 3 / ASSESSMENT_BANK mode. Now that a real,
 * course-scoped, reusable `QuestionBankItem` entity exists (004 Question
 * Bank batch, T107/FR-064 — see `question-bank.service.ts`), "clone only
 * the assessment bank" has a coherent target: copy every `QuestionBankItem`
 * (+ its options) from the source course into a brand-new course that
 * carries NO curriculum, lessons, or certificate settings — exactly the
 * scenario's own wording. Legacy per-lesson `Quiz`/`Question` rows are
 * deliberately NOT copied here: they belong 1:1 to a Lesson, and this mode
 * creates no lessons, so there is nothing coherent to attach them to — the
 * "assessment bank" a clone of this mode produces is the reusable template
 * pool, not any one quiz's already-built instance.
 */
async function cloneAssessmentBankOnly(sourceCourseId: string, input: CloneCourseInput, actorId: string): Promise<AdminCourse> {
  const source = await findCourseById(sourceCourseId);
  if (!source) throw AppError.notFound('Course not found');

  const course = await withTransaction(
    async (tx) => {
      const newCourse = await createCourseRow(
        {
          title: input.title?.trim() || `${source.title} (Assessment Bank Copy)`,
          slug: input.slug,
          language: source.language,
          level: source.level,
          category: source.categoryId ? { connect: { id: source.categoryId } } : undefined,
          certificateAvailable: false,
          priceType: 'FREE',
          priceAmountMinor: 0,
          currency: source.currency,
          status: 'DRAFT',
          createdBy: actorId,
          updatedBy: actorId,
        },
        tx,
      );

      const bankItems = await tx.questionBankItem.findMany({
        where: { courseId: sourceCourseId, deletedAt: null },
        include: { options: { orderBy: { position: 'asc' } } },
      });

      for (const item of bankItems) {
        await tx.questionBankItem.create({
          data: {
            course: { connect: { id: newCourse.id } },
            type: item.type,
            prompt: item.prompt,
            explanation: item.explanation,
            points: item.points,
            category: item.category,
            difficulty: item.difficulty,
            learningObjective: item.learningObjective,
            tags: item.tags,
            language: item.language,
            // A cloned bank item is a brand-new template lineage in its own
            // course — usage history and version count belong to the
            // ORIGINAL bank, not the copy (same "no history carries over"
            // principle FR-098/SC-008 applies to everything else this
            // service clones).
            version: 1,
            reviewStatus: item.reviewStatus,
            usageCount: 0,
            answerKey: item.answerKey as never,
            status: item.status,
            createdBy: actorId,
            updatedBy: actorId,
            options: item.options.length
              ? { create: item.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, position: o.position })) }
              : undefined,
          },
        });
      }

      await recordAuditEvent(
        {
          actorType: 'USER',
          actorId,
          action: 'lms.course.cloned',
          resourceType: 'course',
          resourceId: newCourse.id,
          afterState: { sourceCourseId, mode: input.mode, bankItemsCopied: bankItems.length },
        },
        tx,
      );

      return newCourse;
    },
    { timeout: 20_000 },
  );

  const full = await findCourseById(course.id);
  if (!full) throw AppError.internal('Cloned course could not be reloaded');
  return toAdminCourse(full);
}

export async function cloneCourse(sourceCourseId: string, input: CloneCourseInput, actorId: string): Promise<AdminCourse> {
  if (input.mode === 'ASSESSMENT_BANK') {
    return cloneAssessmentBankOnly(sourceCourseId, input, actorId);
  }

  const source = await findCourseById(sourceCourseId);
  if (!source) throw AppError.notFound('Course not found');

  const copies = MODE_COPIES[input.mode];

  const course = await withTransaction(
    async (tx) => {
      const newCourse = await createCourseRow(
        {
          title: input.title?.trim() || `${source.title} (Copy)`,
          slug: input.slug,
          subtitle: copies.curriculum ? source.subtitle : null,
          shortDescription: copies.curriculum ? source.shortDescription : null,
          description: copies.curriculum ? source.description : null,
          learningOutcomes: copies.curriculum ? source.learningOutcomes : [],
          tags: copies.curriculum ? source.tags : [],
          targetAudience: copies.curriculum ? source.targetAudience : null,
          toolsRequired: copies.curriculum ? source.toolsRequired : [],
          thumbnailUrl: copies.curriculum ? source.thumbnailUrl : null,
          coverImageUrl: copies.curriculum ? source.coverImageUrl : null,
          trailerUrl: copies.curriculum ? source.trailerUrl : null,
          language: input.mode === 'TRANSLATION_VARIANT' ? (input.language ?? source.language) : source.language,
          level: source.level,
          category: source.categoryId ? { connect: { id: source.categoryId } } : undefined,
          durationMinutes: copies.curriculum ? source.durationMinutes : null,
          estimatedCompletionMinutes: copies.curriculum ? source.estimatedCompletionMinutes : null,
          weeklyCommitmentMinutes: copies.curriculum ? source.weeklyCommitmentMinutes : null,
          certificateAvailable: copies.certificateSettings ? source.certificateAvailable : false,
          ...(copies.certificateSettings && source.certificateTemplateId
            ? { certificateTemplate: { connect: { id: source.certificateTemplateId } } }
            : {}),
          // Pricing is treated as financial data under FR-098/SC-008's "no
          // financial data carries over" guarantee — every clone mode
          // starts FREE/0; an admin sets real pricing after review.
          priceType: 'FREE',
          priceAmountMinor: 0,
          currency: source.currency,
          status: 'DRAFT',
          // FR-101 — a translation variant starts its status workflow at
          // NOT_STARTED the moment it's cloned; every other clone mode
          // leaves `translationStatus` null (meaningless for a non-variant course).
          ...(input.mode === 'TRANSLATION_VARIANT'
            ? { translationOfCourse: { connect: { id: sourceCourseId } }, translationStatus: 'NOT_STARTED' as never }
            : {}),
          createdBy: actorId,
          updatedBy: actorId,
        },
        tx,
      );

      if (copies.instructors) {
        const instructors = await tx.courseInstructor.findMany({ where: { courseId: sourceCourseId } });
        for (const instructor of instructors) {
          await tx.courseInstructor.create({
            data: { courseId: newCourse.id, userId: instructor.userId, role: instructor.role, isPrimary: instructor.isPrimary, createdBy: actorId },
          });
        }
      }

      if (copies.curriculum) {
        await cloneModulesLessonsAndContent(tx, sourceCourseId, newCourse.id, copies);
      }

      await recordAuditEvent(
        {
          actorType: 'USER',
          actorId,
          action: 'lms.course.cloned',
          resourceType: 'course',
          resourceId: newCourse.id,
          afterState: { sourceCourseId, mode: input.mode },
        },
        tx,
      );

      return newCourse;
    },
    { timeout: 20_000 },
  );

  const full = await findCourseById(course.id);
  if (!full) throw AppError.internal('Cloned course could not be reloaded');
  return toAdminCourse(full);
}
