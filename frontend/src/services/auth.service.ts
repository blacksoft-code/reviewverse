import { apiFetch } from '@/lib/api';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  success: boolean;
  statusCode: number;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
};

export async function registerUser(
  payload: RegisterPayload,
) {
  return apiFetch<RegisterResponse>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  statusCode: number;
  data: {
    access_token: string;
  };
  timestamp: string;
};

export async function loginUser(
  payload: LoginPayload,
) {
  return apiFetch<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type ProfileResponse = {
  success: boolean;
  statusCode: number;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  timestamp: string;
};

export async function getProfile() {
  return apiFetch<ProfileResponse>(
    '/auth/profile',
  );
}

// NEW:
// Browser-এর localStorage-এ JWT access token save করবে.
// Login successful হওয়ার পর এই function call করব।
export function saveAccessToken(
  token: string,
) {
  localStorage.setItem(
    'access_token',
    token,
  );
}

// NEW:
// localStorage থেকে JWT token বের করবে।
export function getAccessToken() {
  return localStorage.getItem(
    'access_token',
  );
}

// NEW:
// Logout করার সময় JWT token remove করবে।
export function removeAccessToken() {
  localStorage.removeItem(
    'access_token',
  );
}