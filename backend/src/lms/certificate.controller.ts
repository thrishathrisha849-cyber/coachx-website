import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  listTemplatesAdmin,
  createCertificateTemplate,
  updateExistingTemplate,
  mapCourseTemplate,
} from './certificate.service';
import { verifyCertificateByCredentialId, revokeCertificate, listCertificatesForCourseAdmin } from './certificate-verification.service';

// --- Admin: Certificate templates (004 US5 Certificate System batch) -----

export const getTemplatesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await listTemplatesAdmin();
  res.status(200).json(buildSuccessResponse(templates));
});

export const postTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await createCertificateTemplate(req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(template));
});

export const patchTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await updateExistingTemplate(req.params.templateId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(template));
});

export const postCourseTemplateMapping = asyncHandler(async (req: Request, res: Response) => {
  await mapCourseTemplate(req.params.courseId, req.body.templateId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ mapped: true }));
});

// --- Admin: Certificates (list/revoke) ------------------------------------

export const getCertificatesForCourseAdmin = asyncHandler(async (req: Request, res: Response) => {
  const certificates = await listCertificatesForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(certificates));
});

export const postRevokeCertificate = asyncHandler(async (req: Request, res: Response) => {
  await revokeCertificate(req.params.certificateId, req.body.reason, req.user!.id);
  res.status(200).json(buildSuccessResponse({ revoked: true }));
});

// --- Public: verification (FR-085, no auth required) ----------------------

export const getPublicCertificateVerification = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyCertificateByCredentialId(req.params.credentialId);
  res.status(200).json(buildSuccessResponse(result));
});
