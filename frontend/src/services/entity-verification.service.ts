import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type VerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED'
  | 'EXPIRED';

export type VerificationDocType =
  | 'NID'
  | 'PASSPORT'
  | 'BUSINESS_REGISTRATION'
  | 'TRADE_LICENSE'
  | 'OTHER';

export const DOC_TYPE_LABELS: Record<VerificationDocType, string> = {
  NID: 'National ID (NID)',
  PASSPORT: 'Passport',
  BUSINESS_REGISTRATION: 'Business registration',
  TRADE_LICENSE: 'Trade license',
  OTHER: 'Other document',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

export type VerificationDocument = {
  id: string;
  type: VerificationDocType;
  originalName: string;
  mimeType: string;
  size: number;
};

export type VerificationApplication = {
  id: string;
  status: VerificationStatus;
  applicantNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  documents: VerificationDocument[];
};

export type VerificationState = {
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedUntil: string | null;
  renewalDue: boolean;
  canApply: boolean;
  applications: VerificationApplication[];
};

export type AdminVerification = VerificationApplication & {
  entity: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    isVerified: boolean;
  };
  applicant: { id: string; name: string; email: string };
  reviewer: { id: string; name: string } | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

function token() {
  return typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;
}

// ───────── Business side ─────────

export async function getVerificationState(entityId: string) {
  return apiFetch<ApiEnvelope<VerificationState>>(
    `/entity-verifications/entity/${entityId}`,
  );
}

// Document upload multipart — তাই আলাদা fetch (Content-Type browser নিজে বসায়)
export async function applyForVerification(
  entityId: string,
  documents: { type: VerificationDocType; file: File }[],
  note: string,
): Promise<VerificationState> {
  const formData = new FormData();

  documents.forEach((d) => formData.append('files', d.file));
  formData.append(
    'types',
    JSON.stringify(documents.map((d) => d.type)),
  );

  if (note.trim()) {
    formData.append('note', note.trim());
  }

  const headers: Record<string, string> = {};
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  // Business settings একটা business-mode কাজ — backend এই header দিয়ে যাচাই করে
  headers['X-Acting-Entity-Id'] = entityId;

  const response = await fetch(
    `${API_URL}/entity-verifications/entity/${entityId}/apply`,
    { method: 'POST', headers, body: formData },
  );

  const body = await response.json();

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message ?? 'Could not submit your application');
  }

  return body.data as VerificationState;
}

export async function withdrawVerification(id: string) {
  return apiFetch<ApiEnvelope<VerificationState>>(
    `/entity-verifications/${id}`,
    { method: 'DELETE' },
  );
}

// ───────── Admin (verification team) ─────────

export async function getAdminVerifications(
  status?: VerificationStatus,
) {
  return apiFetch<ApiEnvelope<AdminVerification[]>>(
    `/entity-verifications/admin/list${
      status ? `?status=${status}` : ''
    }`,
  );
}

export async function startVerificationReview(id: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-verifications/admin/${id}/start-review`,
    { method: 'PATCH' },
  );
}

export async function approveVerification(id: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-verifications/admin/${id}/approve`,
    { method: 'PATCH' },
  );
}

export async function rejectVerification(id: string, reason: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-verifications/admin/${id}/reject`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
  );
}

export async function revokeVerification(id: string, reason: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-verifications/admin/${id}/revoke`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
  );
}

// Private document — token লাগে, তাই <a href> না, blob করে নতুন tab-এ খোলা হয়
export async function openVerificationDocument(documentId: string) {
  // popup blocker এড়াতে click-এর সাথে সাথেই tab খুলে রাখা
  const tab = window.open('', '_blank');

  try {
    const t = token();

    const response = await fetch(
      `${API_URL}/entity-verifications/admin/documents/${documentId}/file`,
      { headers: t ? { Authorization: `Bearer ${t}` } : {} },
    );

    if (!response.ok) {
      throw new Error('Could not open the document');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, '_blank');
    }

    // কিছুক্ষণ পর memory ছেড়ে দেওয়া
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}
