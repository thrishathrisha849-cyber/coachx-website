import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { submitContactForm } from './contact.service';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from './newsletter.service';

/** POST /api/v1/contact — 002 FR-053. */
export const postContact = asyncHandler(async (req: Request, res: Response) => {
  await submitContactForm({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    department: req.body.department,
    message: req.body.message,
    ipAddress: req.ip ?? null,
    honeypotValue: req.body.website,
  });

  res.status(200).json(buildSuccessResponse({ submitted: true }));
});

/** POST /api/v1/newsletter/subscribe — footer/blog Newsletter capture. */
export const postNewsletterSubscribe = asyncHandler(async (req: Request, res: Response) => {
  await subscribeToNewsletter(req.body.email, req.ip ?? null, req.body.website);
  res.status(200).json(buildSuccessResponse({ subscribed: true }));
});

/** POST /api/v1/newsletter/unsubscribe?token=... — Phase 5 Part 2 safe unsubscribe. */
export const postNewsletterUnsubscribe = asyncHandler(async (req: Request, res: Response) => {
  await unsubscribeFromNewsletter(req.query.token as string);
  res.status(200).json(buildSuccessResponse({ unsubscribed: true }));
});
