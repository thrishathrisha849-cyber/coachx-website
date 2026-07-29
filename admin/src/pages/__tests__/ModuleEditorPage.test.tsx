import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ModuleEditorPage } from '../ModuleEditorPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api', async () => {
  const actual = await vi.importActual<typeof import('@/api/lms.api')>('@/api/lms.api');
  return {
    ...actual,
    getModuleAdminFull: vi.fn(),
    updateModule: vi.fn(),
    releaseModuleNow: vi.fn(),
    listLessonsForModule: vi.fn(),
    listModulesForCourse: vi.fn(),
  };
});

const module1 = {
  id: 'module-1',
  courseId: 'course-1',
  title: 'Module 1',
  description: null,
  outcome: null,
  position: 0,
  estimatedDurationMinutes: null,
  isMandatory: true,
  isPreview: false,
  status: 'PUBLISHED',
  prerequisiteModuleId: null,
  releaseRuleType: 'IMMEDIATE',
  completionRuleType: 'MANUAL',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const module2 = { ...module1, id: 'module-2', title: 'Module 2', position: 1 };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-modules/module-2']}>
      <Routes>
        <Route path="/lms-modules/:moduleId" element={<ModuleEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ModuleEditorPage — prerequisite picker (004 US6 polish batch, T086)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getModuleAdminFull).mockReset();
    vi.mocked(lmsApi.updateModule).mockReset();
    vi.mocked(lmsApi.listLessonsForModule).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.listModulesForCourse).mockReset();
  });

  it('only offers earlier-position sibling modules as a prerequisite', async () => {
    vi.mocked(lmsApi.getModuleAdminFull).mockResolvedValue(module2);
    vi.mocked(lmsApi.listModulesForCourse).mockResolvedValue([module1, module2]);

    renderPage();

    await screen.findByText('Module 2');
    const select = screen.getByLabelText('Prerequisite module') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.text);
    expect(optionLabels).toContain('Module 1');
    expect(optionLabels).not.toContain('Module 2');
  });

  it('saves the selected prerequisite module', async () => {
    vi.mocked(lmsApi.getModuleAdminFull).mockResolvedValue(module2);
    vi.mocked(lmsApi.listModulesForCourse).mockResolvedValue([module1, module2]);
    vi.mocked(lmsApi.updateModule).mockResolvedValue({ ...module2, prerequisiteModuleId: 'module-1' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Module 2');
    await user.selectOptions(screen.getByLabelText('Prerequisite module'), 'module-1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(lmsApi.updateModule).toHaveBeenCalledWith('module-2', expect.objectContaining({ prerequisiteModuleId: 'module-1' }));
  });
});
