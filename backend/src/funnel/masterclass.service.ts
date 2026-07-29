import { HttpStatus } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getEmailAdapter } from '../auth/email.port';
import { PUBLIC_ERROR_CODES } from '../common/errors/public-error-codes';
import {
  findMasterclassConfigBySlug,
  findMasterclassRegistration,
  createMasterclassRegistration,
} from './funnel.repository';

export interface MasterclassStatus {
  scheduledAt: Date;
  registrationClosesAt: Date | null;
  seatLimit: number | null;
  seatsRemaining: number | null;
  isFull: boolean;
  isClosed: boolean;
  speakerName: string | null;
}

/**
 * 002 FR-058/FR-112: the ONLY source for the registration countdown/seat
 * count a masterclass landing page renders — never a client-fabricated
 * value. `seatsRemaining`/`isFull` are null/false when `seatLimit` is
 * unset (unlimited), so the frontend never invents a scarcity number.
 */
export async function getMasterclassStatus(slug: string, language: string): Promise<MasterclassStatus> {
  const config = await findMasterclassConfigBySlug(slug, language);
  if (!config) throw AppError.notFound('Masterclass not found');

  const registeredCount = (config as unknown as { _count: { registrations: number } })._count.registrations;
  const seatsRemaining = config.seatLimit !== null ? Math.max(config.seatLimit - registeredCount, 0) : null;

  return {
    scheduledAt: config.scheduledAt,
    registrationClosesAt: config.registrationClosesAt,
    seatLimit: config.seatLimit,
    seatsRemaining,
    isFull: seatsRemaining !== null && seatsRemaining <= 0,
    isClosed: Boolean(config.registrationClosesAt && config.registrationClosesAt < new Date()),
    speakerName: config.speakerName,
  };
}

export interface MasterclassRegistrationInput {
  slug: string;
  language: string;
  name: string;
  email: string;
  mobile?: string;
  city?: string;
  profession?: string;
  experienceLevel?: string;
  referralCode?: string;
  honeypotValue?: string;
}

/**
 * 002 FR-046, US3 edge cases: seat availability is RE-CHECKED server-side
 * inside the same transaction as the insert (never trusting a
 * previously-fetched client-side seat count), and a duplicate identity
 * is rejected by the `(configId, email)` unique constraint.
 */
export async function registerForMasterclass(input: MasterclassRegistrationInput) {
  if (input.honeypotValue) {
    return { registrationId: 'noop', alreadyRegistered: false };
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  return withTransaction(async (tx) => {
    const config = await findMasterclassConfigBySlug(input.slug, input.language, tx);
    if (!config) throw AppError.notFound('Masterclass not found');

    if (config.registrationClosesAt && config.registrationClosesAt < new Date()) {
      throw new AppError(
        'Registration for this masterclass has closed',
        HttpStatus.BAD_REQUEST,
        PUBLIC_ERROR_CODES.RESOURCE_UNAVAILABLE,
      );
    }

    const existing = await findMasterclassRegistration(config.id, normalizedEmail, tx);
    if (existing) {
      throw new AppError(
        'You are already registered for this masterclass',
        HttpStatus.CONFLICT,
        PUBLIC_ERROR_CODES.DUPLICATE_REGISTRATION,
      );
    }

    if (config.seatLimit !== null) {
      const registeredCount = (config as unknown as { _count: { registrations: number } })._count.registrations;
      if (registeredCount >= config.seatLimit) {
        throw new AppError('This masterclass is fully booked', HttpStatus.CONFLICT, PUBLIC_ERROR_CODES.EVENT_FULL);
      }
    }

    const registration = await createMasterclassRegistration(
      {
        config: { connect: { id: config.id } },
        name: input.name,
        email: normalizedEmail,
        mobile: input.mobile,
        city: input.city,
        profession: input.profession,
        experienceLevel: input.experienceLevel,
        referralCode: input.referralCode,
      },
      tx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: registration.id,
        action: 'funnel.masterclass_registered',
        resourceType: 'masterclass_registration',
        resourceId: registration.id,
        afterState: { slug: input.slug },
      },
      tx,
    );

    await getEmailAdapter().send({
      to: normalizedEmail,
      subject: 'You\'re registered!',
      text: `You're confirmed for the masterclass on ${config.scheduledAt.toISOString()}. We'll send you reminders as the date approaches.`,
    });

    return { registrationId: registration.id, alreadyRegistered: false };
  });
}
