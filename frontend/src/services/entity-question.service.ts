import { apiFetch } from '@/lib/api';

export const QUESTION_MAX_LENGTH = 500;
export const ANSWER_MAX_LENGTH = 2000;

export type EntityQuestion = {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  asker: {
    id: string;
    name: string;
  };
};

// Backend-এর ResponseInterceptor সব response-কে wrap করে দেয়।
type ApiEnvelope<T, M = undefined> = {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: M;
  timestamp?: string;
};

// =========================
// PUBLIC (লগইন করা থাকলে meta.canAnswer আসে)
// =========================

export async function getEntityQuestions(entityId: string) {
  return apiFetch<
    ApiEnvelope<EntityQuestion[], { canAnswer: boolean }>
  >(`/entity-questions/entity/${entityId}`);
}

// =========================
// LOGGED-IN USER
// =========================

export async function askQuestion(
  entityId: string,
  question: string,
) {
  return apiFetch<ApiEnvelope<EntityQuestion>>(
    `/entity-questions/entity/${entityId}`,
    {
      method: 'POST',
      body: JSON.stringify({ question }),
    },
  );
}

// =========================
// OWNER / MANAGER ONLY
// =========================

export async function answerQuestion(
  questionId: string,
  answer: string,
) {
  return apiFetch<ApiEnvelope<EntityQuestion>>(
    `/entity-questions/${questionId}/answer`,
    {
      method: 'PATCH',
      body: JSON.stringify({ answer }),
    },
  );
}
