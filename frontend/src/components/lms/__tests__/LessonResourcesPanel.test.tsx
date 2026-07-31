import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonResourcesPanel } from '../LessonResourcesPanel';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const downloadableResource: lmsApi.PublicLessonResource = {
  id: 'resource-1',
  lessonId: 'lesson-1',
  title: 'Worksheet PDF',
  type: 'PDF',
  description: null,
  language: 'EN',
  fileUrl: 'https://example.com/worksheet.pdf',
  fileSizeBytes: null,
  version: 1,
  downloadPermission: 'DOWNLOADABLE',
  accessRule: 'ENROLLED_ONLY',
  position: 0,
};

const viewOnlyResource: lmsApi.PublicLessonResource = { ...downloadableResource, id: 'resource-2', title: 'Preview Handout', downloadPermission: 'VIEW_ONLY' };

describe('LessonResourcesPanel (004 Downloadable Resource Catalog batch, FR-049)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyLessonResources).mockReset();
    vi.mocked(lmsApi.downloadResource).mockReset();
    vi.mocked(lmsApi.markResourceViewed).mockReset();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders nothing when the lesson has no resources', async () => {
    vi.mocked(lmsApi.getMyLessonResources).mockResolvedValue([]);
    const { container } = render(<LessonResourcesPanel lessonId="lesson-1" />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('calls the real download-tracking endpoint and opens the returned fileUrl for a DOWNLOADABLE resource', async () => {
    vi.mocked(lmsApi.getMyLessonResources).mockResolvedValue([downloadableResource]);
    vi.mocked(lmsApi.downloadResource).mockResolvedValue({ fileUrl: 'https://example.com/worksheet.pdf' });

    const user = userEvent.setup();
    render(<LessonResourcesPanel lessonId="lesson-1" />);

    const button = await screen.findByRole('button', { name: /Worksheet PDF/ });
    await user.click(button);

    await waitFor(() => expect(lmsApi.downloadResource).toHaveBeenCalledWith('resource-1'));
    expect(window.open).toHaveBeenCalledWith('https://example.com/worksheet.pdf', '_blank', 'noopener,noreferrer');
  });

  it('calls the real viewed-tracking endpoint for a VIEW_ONLY resource instead of the download endpoint', async () => {
    vi.mocked(lmsApi.getMyLessonResources).mockResolvedValue([viewOnlyResource]);
    vi.mocked(lmsApi.markResourceViewed).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<LessonResourcesPanel lessonId="lesson-1" />);

    const button = await screen.findByRole('button', { name: /Preview Handout/ });
    await user.click(button);

    await waitFor(() => expect(lmsApi.markResourceViewed).toHaveBeenCalledWith('resource-2'));
    expect(lmsApi.downloadResource).not.toHaveBeenCalled();
  });
});
