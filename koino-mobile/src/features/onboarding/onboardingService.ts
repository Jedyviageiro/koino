import { getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import { apiRequest } from '@/services/api';

import type { OnboardingAnswers } from './types';

export async function completeOnboarding(answers: OnboardingAnswers) {
  const session = await getAuthSession();
  if (!session?.token) throw new Error('Your session has expired. Please log in again.');

  const result = await apiRequest<unknown>('/onboarding', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(answers),
  });
  await saveAuthSession({ ...session, onboardingCompleted: true });
  return result;
}
