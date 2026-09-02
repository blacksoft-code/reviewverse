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

export type UserRelationship = {
isFollowing: boolean;
isFollower: boolean;
isFriend: boolean;
 friendRequestId: string | null;
friendRequestStatus:
| 'PENDING'
| 'ACCEPTED'
| 'REJECTED'
| null;
friendRequestDirection:
| 'SENT'
| 'RECEIVED'
| null;
isBlocked: boolean;
isBlockedByTarget: boolean;
};

async function request(
url: string,
options: RequestInit = {},
) {
const token =
typeof window !== 'undefined'
? localStorage.getItem('access_token')
: null;

const response = await fetch(
`${API_URL}${url}`,
{
...options,
headers: {
'Content-Type': 'application/json',
...(token
? {
Authorization: `Bearer ${token}`,
}
: {}),
...options.headers,
},
cache: 'no-store',
},
);

const result = await response.json();

if (!response.ok) {
throw new Error(
result?.message ||
'Something went wrong',
);
}

return result;
}

export async function getUserProfile(
userId: string,
) {
return request(`/users/${userId}`);
}

export async function getUserRelationship(
userId: string,
) {
return request(
`/users/${userId}/relationship`,
) as Promise<{
success: boolean;
statusCode: number;
data: UserRelationship;
timestamp: string;
}>;
}

export async function followUser(
userId: string,
) {
return request(
`/users/${userId}/follow`,
{
method: 'POST',
},
);
}

export async function unfollowUser(
userId: string,
) {
return request(
`/users/${userId}/follow`,
{
method: 'DELETE',
},
);
}

export async function sendFriendRequest(
  userId: string,
) {
  return request(
    `/users/${userId}/friend-request`,
    {
      method: 'POST',
    },
  ) as Promise<{
    success: boolean;
    statusCode: number;
    data: {
      id: string;
      senderId: string;
      receiverId: string;
      status: 'PENDING';
      createdAt: string;
      updatedAt: string;
    };
    timestamp: string;
  }>;
}

export async function acceptFriendRequest(
requestId: string,
) {
return request(
`/users/friend-request/${requestId}/accept`,
{
method: 'PATCH',
},
);
}

export async function rejectFriendRequest(
requestId: string,
) {
return request(
`/users/friend-request/${requestId}/reject`,
{
method: 'PATCH',
},
);
}

export async function cancelFriendRequest(
requestId: string,
) {
return request(
`/users/friend-request/${requestId}`,
{
method: 'DELETE',
},
);
}

export async function getFriends(
userId: string,
) {
return request(
`/users/${userId}/friends`,
);
}

export async function unfriendUser(
userId: string,
) {
return request(
`/users/${userId}/unfriend`,
{
method: 'DELETE',
},
);
}

export async function getPendingFriendRequests() {
return request(
`/users/friend-requests`,
);
}

export async function blockUser(
userId: string,
) {
return request(
`/users/${userId}/block`,
{
method: 'POST',
},
);
}

export async function unblockUser(
userId: string,
) {
return request(
`/users/${userId}/unblock`,
{
method: 'DELETE',
},
);
}

export async function followEntity(entityId: string) {
  return request(`/users/entity/${entityId}/follow`, {
    method: 'POST',
  });
}

export async function unfollowEntity(entityId: string) {
  return request(`/users/entity/${entityId}/unfollow`, {
    method: 'DELETE',
  });
}

export async function blockEntity(entityId: string) {
  return request(`/users/entity/${entityId}/block`, {
    method: 'POST',
  });
}

export async function unblockEntity(entityId: string) {
  return request(`/users/entity/${entityId}/unblock`, {
    method: 'DELETE',
  });


}
export async function getEntityRelationshipStatus(
  entityId: string,
) {
  return request(
    `/users/entity/${entityId}/status`,
  ) as Promise<{
    success: boolean;
    statusCode: number;
    data: {
      isFollowing: boolean;
      isBlocked: boolean;
    };
    timestamp: string;
  }>;
}