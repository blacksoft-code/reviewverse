import { apiFetch } from '@/lib/api';
import { Entity } from '@/services/entity.service';

export type EntityRole = 'OWNER' | 'ADMIN' | 'EDITOR';
export type EntityClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MembershipUser = {
  id: string;
  name: string;
  email: string;
};

export type EntityMembership = {
  id: string;
  userId: string;
  entityId: string;
  role: EntityRole;
  createdAt: string;
  updatedAt: string;
  entity?: Entity;
  user?: MembershipUser;
};

export type EntityClaim = {
  id: string;
  entityId: string;
  userId: string;
  status: EntityClaimStatus;
  createdAt: string;
  updatedAt: string;
  entity?: Entity;
  user?: MembershipUser;
};

// Backend-এর ResponseInterceptor সব response-কে
// { success, statusCode, data, timestamp } আকারে wrap করে দেয়।
type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp?: string;
};

// =========================
// USER FLOW
// =========================

export async function claimBusiness(entityId: string) {
  return apiFetch<ApiEnvelope<EntityClaim>>(
    `/entity-memberships/claim/${entityId}`,
    { method: 'POST' },
  );
}

export async function getMyClaims() {
  return apiFetch<ApiEnvelope<EntityClaim[]>>(
    '/entity-memberships/my-claims',
  );
}

export async function getMyMemberships() {
  return apiFetch<ApiEnvelope<EntityMembership[]>>(
    '/entity-memberships/my-memberships',
  );
}

export async function getEntityMemberships(
  entityId: string,
) {
  return apiFetch<ApiEnvelope<EntityMembership[]>>(
    `/entity-memberships/entity/${entityId}`,
  );
}

// =========================
// ADMIN FLOW
// =========================

export async function getPendingClaims() {
  return apiFetch<ApiEnvelope<EntityClaim[]>>(
    '/entity-memberships/claims/pending',
  );
}

export async function approveClaim(claimId: string) {
  return apiFetch<
    ApiEnvelope<{
      claim: EntityClaim;
      membership: EntityMembership;
    }>
  >(`/entity-memberships/claims/${claimId}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectClaim(claimId: string) {
  return apiFetch<ApiEnvelope<EntityClaim>>(
    `/entity-memberships/claims/${claimId}/reject`,
    { method: 'PATCH' },
  );
}