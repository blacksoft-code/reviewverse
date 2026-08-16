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