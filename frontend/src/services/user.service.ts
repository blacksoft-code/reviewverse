

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000';

export type UserProfileReview = {
  id: string;
  rating: number;
  content: string;
  createdAt: string;

  entity: {
    id: string;
    name: string;
    slug: string;
    location: string | null;

    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type UserProfile = {
  id: string;
  name: string;
  createdAt: string;
  reviewCount: number;
  reviews: UserProfileReview[];
};

export async function getUserProfile(
  userId: string,
) {
  const response = await fetch(
    `${API_URL}/users/${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message ||
        'Failed to load user profile',
    );
  }

  return result as {
    success: boolean;
    statusCode: number;
    data: UserProfile;
    timestamp: string;
  };
}
