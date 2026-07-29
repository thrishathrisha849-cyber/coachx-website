import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { captureLeadMagnetSubmission } from './lead-capture.service';
import { getMasterclassStatus, registerForMasterclass } from './masterclass.service';
import { getFunnelCoverageReport } from './funnel-journey-tagger.service';
import { withdrawConsent, createMasterclassConfig } from './funnel.repository';
import { getPrismaClient } from '../database/prisma-client';
import { recordAuditEvent } from '../database/audit-event.repository';

/** POST /api/v1/funnel/leads — 002 FR-055/056, US2. */
export const postCaptureLead = asyncHandler(async (req: Request, res: Response) => {
  const result = await captureLeadMagnetSubmission({
    leadMagnetSlug: req.body.leadMagnetSlug,
    email: req.body.email,
    name: req.body.name,
    mobile: req.body.mobile,
    profession: req.body.profession,
    businessStage: req.body.businessStage,
    interest: req.body.interest,
    consentMarketingEmail: req.body.consentMarketingEmail,
    utmSource: req.body.utmSource,
    utmMedium: req.body.utmMedium,
    utmCampaign: req.body.utmCampaign,
    utmTerm: req.body.utmTerm,
    utmContent: req.body.utmContent,
    referralCode: req.body.referralCode,
    affiliateId: req.body.affiliateId,
    landingPageVariant: req.body.landingPageVariant,
    ipAddress: req.ip ?? null,
    honeypotValue: req.body.website,
  });
  res.status(201).json(buildSuccessResponse(result));
});

/** POST /api/v1/funnel/consent/withdraw — 002 FR-102, US8 acceptance scenario 3 (immediate-effect withdrawal). */
export const postWithdrawConsent = asyncHandler(async (req: Request, res: Response) => {
  await withdrawConsent(req.body.email, req.body.channel);
  await recordAuditEvent({
    actorType: 'USER',
    actorId: req.body.email,
    action: 'funnel.consent_withdrawn',
    resourceType: 'consent_record',
    resourceId: req.body.email,
    afterState: { channel: req.body.channel },
  });
  res.status(200).json(buildSuccessResponse({ withdrawn: true }));
});

/** GET /api/v1/funnel/masterclass/status — 002 FR-058/FR-112 (public, backend-sourced countdown/seats). */
export const getMasterclassStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const status = await getMasterclassStatus(String(req.query.slug), String(req.query.language ?? 'EN'));
  res.status(200).json(buildSuccessResponse(status));
});

/** POST /api/v1/funnel/masterclass/register — 002 FR-046, US3. */
export const postRegisterForMasterclass = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerForMasterclass({
    slug: req.body.slug,
    language: req.body.language,
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    city: req.body.city,
    profession: req.body.profession,
    experienceLevel: req.body.experienceLevel,
    referralCode: req.body.referralCode,
    honeypotValue: req.body.website,
  });
  res.status(201).json(buildSuccessResponse(result));
});

/** POST /api/v1/funnel/admin/masterclass-configs — `content.manage` (attaches masterclass config to an existing CMS Page). */
export const postCreateMasterclassConfig = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const page = await prisma.page.findFirst({ where: { slug: req.body.pageSlug, language: req.body.language ?? 'EN' } });
  if (!page) throw AppError.notFound('Page not found — create the masterclass landing Page first');

  const config = await createMasterclassConfig({
    page: { connect: { id: page.id } },
    scheduledAt: new Date(req.body.scheduledAt),
    registrationClosesAt: req.body.registrationClosesAt ? new Date(req.body.registrationClosesAt) : undefined,
    seatLimit: req.body.seatLimit,
    speakerName: req.body.speakerName,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: req.user!.id,
    action: 'funnel.masterclass_config_created',
    resourceType: 'masterclass_config',
    resourceId: config.id,
    afterState: { pageSlug: req.body.pageSlug },
  });

  res.status(201).json(buildSuccessResponse(config));
});

/** GET /api/v1/funnel/admin/coverage — 002 FR-059/SC-003 (`kpi.view`). */
export const getFunnelCoverage = asyncHandler(async (_req: Request, res: Response) => {
  const report = await getFunnelCoverageReport();
  res.status(200).json(buildSuccessResponse(report));
});
