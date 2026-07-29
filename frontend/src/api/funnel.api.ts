import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface CaptureLeadInput {
  leadMagnetSlug: string;
  email: string;
  name?: string;
  mobile?: string;
  profession?: string;
  businessStage?: string;
  interest?: string;
  consentMarketingEmail: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referralCode?: string;
  website?: string; // honeypot
}

export async function captureLead(input: CaptureLeadInput): Promise<{ leadId: string; alreadyCaptured: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ leadId: string; alreadyCaptured: boolean }>>('/funnel/leads', input);
  return data.data;
}

export interface MasterclassStatus {
  scheduledAt: string;
  registrationClosesAt: string | null;
  seatLimit: number | null;
  seatsRemaining: number | null;
  isFull: boolean;
  isClosed: boolean;
  speakerName: string | null;
}

export async function getMasterclassStatus(slug: string, language = 'EN'): Promise<MasterclassStatus> {
  const { data } = await apiClient.get<ApiSuccessResponse<MasterclassStatus>>('/funnel/masterclass/status', {
    params: { slug, language },
  });
  return data.data;
}

export interface MasterclassRegistrationInput {
  slug: string;
  language?: string;
  name: string;
  email: string;
  mobile?: string;
  city?: string;
  profession?: string;
  experienceLevel?: string;
  referralCode?: string;
  website?: string; // honeypot
}

export async function registerForMasterclass(
  input: MasterclassRegistrationInput,
): Promise<{ registrationId: string; alreadyRegistered: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ registrationId: string; alreadyRegistered: boolean }>>(
    '/funnel/masterclass/register',
    input,
  );
  return data.data;
}
