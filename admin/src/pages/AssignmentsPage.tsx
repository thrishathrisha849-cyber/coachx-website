import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCourseAdmin,
  getCourseModulesAdmin,
  getModuleLessonsAdmin,
  type AdminCourseSummary,
  type AdminModuleSummary,
  type AdminLessonSummary,
} from '@/api/lms.api';
import { getAssignmentByLessonId } from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

interface ModuleWithLessons extends AdminModuleSummary {
  lessons: (AdminLessonSummary & { assignmentId: string | null })[];
}

/** 004 US4 Assignment System batch — course/module/lesson browser to reach a lesson and attach/manage its assignment. Same minimal pattern as `QuizzesPage.tsx`. */
export function AssignmentsPage() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState('');
  const [course, setCourse] = useState<AdminCourseSummary | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    if (!courseId.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const courseResult = await getCourseAdmin(courseId.trim());
      const moduleResults = await getCourseModulesAdmin(courseId.trim());

      const withLessons = await Promise.all(
        moduleResults.map(async (m): Promise<ModuleWithLessons> => {
          const lessons = await getModuleLessonsAdmin(m.id);
          const lessonsWithAssignment = await Promise.all(
            lessons.map(async (l) => ({ ...l, assignmentId: (await getAssignmentByLessonId(l.id))?.id ?? null })),
          );
          return { ...m, lessons: lessonsWithAssignment };
        }),
      );

      setCourse(courseResult);
      setModules(withLessons.sort((a, b) => a.position - b.position));
      setStatus('ready');
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not find that course.');
      setStatus('error');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Assignments</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">004 US4 — find a course to create or manage a lesson's assignment.</p>

      <div className="mt-6 flex gap-2">
        <input
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Course ID"
          className="w-96 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button onClick={handleLookup} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          Look up
        </button>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && course && (
        <div className="mt-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">{course.title}</h2>
          <div className="mt-4 flex flex-col gap-4">
            {modules.map((module_) => (
              <div key={module_.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{module_.title}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {module_.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{lesson.title}</span>
                      {lesson.assignmentId ? (
                        <button
                          onClick={() => navigate(`/assignments/${lesson.assignmentId}`)}
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Manage assignment
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/assignments/new?lessonId=${lesson.id}`)}
                          className="text-slate-500 hover:text-brand-600 dark:text-slate-400"
                        >
                          + Create assignment
                        </button>
                      )}
                    </li>
                  ))}
                  {module_.lessons.length === 0 && <li className="text-sm text-slate-400">No lessons in this module.</li>}
                </ul>
              </div>
            ))}
            {modules.length === 0 && <p className="text-sm text-slate-400">This course has no modules yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
