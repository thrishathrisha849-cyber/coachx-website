import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createAnnouncementForCourse,
  getAnnouncementAdmin,
  listAnnouncementsForCourseAdmin,
  updateExistingAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  getVisibleAnnouncementsForLearner,
} from './announcement.service';

// --- Admin (004 Course Announcements batch, FR-102) ------------------------

export const postAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await createAnnouncementForCourse(req.params.courseId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(announcement));
});

export const getAnnouncementsForCourseAdmin = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await listAnnouncementsForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(announcements));
});

export const getAnnouncementByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await getAnnouncementAdmin(req.params.announcementId);
  res.status(200).json(buildSuccessResponse(announcement));
});

export const patchAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await updateExistingAnnouncement(req.params.announcementId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(announcement));
});

export const postPublishAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await publishAnnouncement(req.params.announcementId, req.user!.id);
  res.status(200).json(buildSuccessResponse(announcement));
});

export const postArchiveAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await archiveAnnouncement(req.params.announcementId, req.user!.id);
  res.status(200).json(buildSuccessResponse(announcement));
});

// --- Learner-facing ---------------------------------------------------------

export const getMyCourseAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await getVisibleAnnouncementsForLearner(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(announcements));
});
