# Contracts: Certification

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`. Only `CertificateType.COURSE_COMPLETION` has an actual issuance path — the other enum values exist for taxonomy truthfulness but nothing in this API issues them (no `LearningPath`/`Program`/`Event`/`Organization`-training entity exists to own them).

## Public verification

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/certificates/verify/:credentialId` | Public | `credentialIdParamSchema`. Looks up by `Certificate.credentialId` (never the internal `id`). Returns learner/course/instructor names **as snapshotted at issuance** (not a live join — a later name change never alters a verification result), plus `status`. If no row matches, response is `success:false, error.code=NOT_FOUND` — `"NOT_FOUND"` is a response outcome, not a stored `CertificateStatus` value |

## Learner

| Method | Path | Notes |
|---|---|---|
| GET | `/me/certificates` | Caller's own issued certificates, paginated |
| GET | `/me/certificates/:certificateId` | Ownership-checked |
| GET | `/me/courses/:courseId/certificate-eligibility` | Evaluates every FR-081 condition live (course completion, and any course-specific extra conditions) and returns the same structure that would become `eligibilitySnapshot` if issued now — lets the UI show "why you're not eligible yet" without side effects |
| POST | `/me/courses/:courseId/certificate` | Issues the certificate if eligible: creates the `Certificate` row, snapshots `learnerName`/`courseTitle`/`instructorName` at that instant, computes `eligibilitySnapshot`, generates a unique `credentialId`. `403` with `details.code = CERTIFICATE_NOT_ELIGIBLE` if any condition fails — the specific failing condition(s) are echoed in `error.details`. Idempotent in effect: a second call against an already-issued enrollment returns the existing certificate rather than creating a duplicate (`@@unique` on `enrollmentId`) |

No PDF is generated or stored — `Certificate` has no `pdfUrl`/binary field; rendering (if any) is a frontend concern using the `CertificateTemplate` style references.

## Admin (`manageModules` for templates, `manageInstructors` for revocation)

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/admin/certificate-templates` | | `course.view` |
| POST | `/admin/certificate-templates` | `createTemplateSchema`: `name`, `backgroundUrl?`, `logoUrl?`, `signatureUrl?`, `sealUrl?`, `fontFamily?`, `primaryColor?`, `language?` | Image fields are plain admin-supplied URLs — no upload/asset-processing pipeline |
| PATCH | `/admin/certificate-templates/:templateId` | `updateTemplateSchema` | |
| POST | `/admin/courses/:courseId/certificate-template` | `mapCourseTemplateSchema`: `{ templateId }` | Sets `Course.certificateTemplateId` |
| GET | `/admin/courses/:courseId/certificates` | `certificateCourseIdParamSchema` | `course.view` — all issued certificates for the course |
| POST | `/admin/certificates/:certificateId/revoke` | `revokeCertificateSchema`: `{ reason }` | `status → REVOKED`, sets `revokedAt`/`revokedBy`/`revokedReason`. The record is never deleted — a revoked credential ID still resolves via public verification, showing `status=REVOKED` rather than 404 |
