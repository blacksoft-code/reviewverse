const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type MediaType =
  | 'USER_PROFILE'
  | 'USER_COVER'
  | 'ENTITY_LOGO'
  | 'ENTITY_COVER'
  | 'REVIEW'
  | 'ENTITY_POST'
  | 'OFFERING';

export type Media = {
  id: string;
  url: string;
  type: MediaType;
  createdAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// একটা ছবি (profile/cover/logo)
export async function uploadImage(
  file: File,
  type: MediaType,
  targetId: string,
): Promise<Media> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('targetId', targetId);

  const response = await fetch(
    `${API_URL}/media/upload`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    },
  );

  const data: ApiEnvelope<Media> =
    await response.json();

  if (!response.ok) {
    throw new Error(
      (data as unknown as { message?: string })
        ?.message ?? 'Upload failed',
    );
  }

  return data.data;
}

// একাধিক ছবি (review/post — max 10)
export async function uploadImages(
  files: File[],
  type: MediaType,
  targetId: string,
): Promise<Media[]> {
  if (files.length > 10) {
    throw new Error('Maximum 10 photos allowed.');
  }

  const formData = new FormData();
  files.forEach((file) =>
    formData.append('files', file),
  );
  formData.append('type', type);
  formData.append('targetId', targetId);

  const response = await fetch(
    `${API_URL}/media/upload-multiple`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    },
  );

  const data: ApiEnvelope<Media[]> =
    await response.json();

  if (!response.ok) {
    throw new Error(
      (data as unknown as { message?: string })
        ?.message ?? 'Upload failed',
    );
  }

  return data.data;
}