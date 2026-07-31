import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NewCourseWizardPage } from '../NewCourseWizardPage';
import * as lmsApi from '@/api/lms.api';
import type { AdminCourseFull, AdminCourseModuleFull, AdminLessonFull } from '@/api/lms.api';

vi.mock('@/api/lms.api');

const category = {
  id: 'cat-1',
  name: 'Business Fundamentals',
  slug: 'business-fundamentals',
  description: null,
  shortDescription: null,
  imageUrl: null,
  icon: null,
  parentId: null,
  sortOrder: 0,
  isFeatured: false,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <NewCourseWizardPage />
    </MemoryRouter>,
  );
}

describe('NewCourseWizardPage (T092-T095)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listCategoriesAdmin).mockReset().mockResolvedValue([category]);
    vi.mocked(lmsApi.createCourse).mockReset();
    vi.mocked(lmsApi.createModule).mockReset();
    vi.mocked(lmsApi.createLesson).mockReset();
  });

  it('disables Next on step 1 until title, slug, and category are filled', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Business Fundamentals');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'Intro to Business');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');

    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('auto-generates a slug from the title, and walks through every step to create the course/module/lesson in sequence', async () => {
    vi.mocked(lmsApi.createCourse).mockResolvedValue({ id: 'course-1' } as unknown as AdminCourseFull);
    vi.mocked(lmsApi.createModule).mockResolvedValue({ id: 'module-1' } as unknown as AdminCourseModuleFull);
    vi.mocked(lmsApi.createLesson).mockResolvedValue({ id: 'lesson-1' } as unknown as AdminLessonFull);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Business Fundamentals');
    await user.type(screen.getByLabelText('Title'), 'Intro to Business');
    expect(screen.getByLabelText('Slug')).toHaveValue('intro-to-business');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
    await user.click(screen.getByRole('button', { name: 'Next' })); // -> Details

    await user.click(screen.getByRole('button', { name: 'Next' })); // -> First module (all optional)

    await user.click(screen.getByRole('button', { name: 'Next' })); // -> First lesson (module title has a default)

    await user.click(screen.getByRole('button', { name: 'Next' })); // -> Review (lesson title/slug have defaults)

    await user.click(screen.getByRole('button', { name: 'Create course' }));

    expect(lmsApi.createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Intro to Business', slug: 'intro-to-business', categoryId: 'cat-1' }),
    );
    expect(lmsApi.createModule).toHaveBeenCalledWith('course-1', expect.objectContaining({ title: 'Module 1' }));
    expect(lmsApi.createLesson).toHaveBeenCalledWith('module-1', expect.objectContaining({ title: 'Lesson 1', slug: 'lesson-1' }));
  });
});
