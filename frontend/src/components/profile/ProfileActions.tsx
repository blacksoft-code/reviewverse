'use client';

import { useEffect, useState } from 'react';

import {
acceptFriendRequest,
blockUser,
cancelFriendRequest,
followUser,
getUserRelationship,
sendFriendRequest,
unfollowUser,
unblockUser,
unfriendUser,
} from '@/services/user.service';

type ProfileActionsProps = {
userId: string;
};

export default function ProfileActions({
userId,
}: ProfileActionsProps) {
const [isFollowing, setIsFollowing] =
useState(false);

const [isFriend, setIsFriend] =
useState(false);

const [showUnfriend, setShowUnfriend] =
  useState(false);

// CHANGE: Friend request-এর ID রাখার জন্য state যোগ করা হয়েছে
const [friendRequestId, setFriendRequestId] =
useState<string | null>(null);

const [friendRequestStatus, setFriendRequestStatus] =
useState<
'PENDING' | 'ACCEPTED' | 'REJECTED' | null
>(null);

const [friendRequestDirection, setFriendRequestDirection] =
useState<'SENT' | 'RECEIVED' | null>(null);

const [isBlocked, setIsBlocked] =
useState(false);

const [isBlockedByTarget, setIsBlockedByTarget] =
useState(false);

const [loading, setLoading] =
useState<string | null>(null);

const [initialLoading, setInitialLoading] =
useState(true);

useEffect(() => {
let mounted = true;


async function loadRelationship() {
  try {
    const response =
      await getUserRelationship(userId);

    if (!mounted) {
      return;
    }

    setIsFollowing(
      response.data.isFollowing,
    );

    setIsFriend(
      response.data.isFriend,
    );

    setFriendRequestId(
  response.data.friendRequestId,
);

    // CHANGE: Backend থেকে friend request ID নেওয়া হচ্ছে
    setFriendRequestId(
      response.data.friendRequestId,
    );

    setFriendRequestStatus(
      response.data.friendRequestStatus,
    );

    setFriendRequestDirection(
      response.data.friendRequestDirection,
    );

    setIsBlocked(
      response.data.isBlocked,
    );

    setIsBlockedByTarget(
      response.data.isBlockedByTarget,
    );
  } catch (error) {
    if (mounted) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    }
  } finally {
    if (mounted) {
      setInitialLoading(false);
    }
  }
}

loadRelationship();

return () => {
  mounted = false;
};


}, [userId]);

const handleFollow = async () => {
try {
setLoading('follow');


  if (isFollowing) {
    await unfollowUser(userId);
    setIsFollowing(false);
  } else {
    await followUser(userId);
    setIsFollowing(true);
  }
} catch (error) {
  alert(
    error instanceof Error
      ? error.message
      : 'Something went wrong',
  );
} finally {
  setLoading(null);
}


};

const handleAcceptFriendRequest = async () => {
  try {
    setLoading('friend');

    if (!friendRequestId) {
      return;
    }

    await acceptFriendRequest(friendRequestId);

    setIsFriend(true);
    setFriendRequestStatus(null);
    setFriendRequestDirection(null);
    setFriendRequestId(null);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Something went wrong',
    );
  } finally {
    setLoading(null);
  }
};

const handleFriendRequest = async () => {
  try {
    setLoading('friend');

    if (
      friendRequestStatus === 'PENDING' &&
      friendRequestDirection === 'SENT' &&
      friendRequestId
    ) {
      await cancelFriendRequest(
        friendRequestId,
      );

      setFriendRequestId(null);
      setFriendRequestStatus(null);
      setFriendRequestDirection(null);

      return;
    }

    const response = await sendFriendRequest(
  userId,
);

setFriendRequestId(
  response.data.id,
);

setFriendRequestStatus('PENDING');
setFriendRequestDirection('SENT');

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Something went wrong',
    );
  } finally {
    setLoading(null);
  }
};

// CHANGE: Sent friend request cancel করার নতুন handler
const handleCancelFriendRequest = async () => {
if (!friendRequestId) {
return;
}


try {
  setLoading('friend');

  await cancelFriendRequest(
    friendRequestId,
  );

  // CHANGE: Cancel সফল হলে local state reset করা হচ্ছে
  setFriendRequestId(null);
  setFriendRequestStatus(null);
  setFriendRequestDirection(null);
} catch (error) {
  alert(
    error instanceof Error
      ? error.message
      : 'Something went wrong',
  );
} finally {
  setLoading(null);
}


};

const handleBlock = async () => {
try {
setLoading('block');


  if (isBlocked) {
    await unblockUser(userId);
    setIsBlocked(false);
  } else {
    await blockUser(userId);

    setIsBlocked(true);
    setIsFollowing(false);
    setIsFriend(false);
    setFriendRequestId(null);
    setFriendRequestStatus(null);
    setFriendRequestDirection(null);
  }
} catch (error) {
  alert(
    error instanceof Error
      ? error.message
      : 'Something went wrong',
  );
} finally {
  setLoading(null);
}


};

const handleUnfriend = async () => {
try {
setLoading('friend');


  await unfriendUser(userId);

  setIsFriend(false);
  setShowUnfriend(false);
} catch (error) {
  alert(
    error instanceof Error
      ? error.message
      : 'Something went wrong',
  );
} finally {
  setLoading(null);
}


};

if (initialLoading) {
return ( <div className="mt-5 flex flex-wrap gap-3"> <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" /> <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" /> <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-200" /> </div>
);
}

const actionsDisabled =
loading !== null ||
isBlockedByTarget;

return ( <div className="mt-5 flex flex-wrap gap-3">
<button
type="button"
onClick={handleFollow}
disabled={
actionsDisabled ||
isBlocked
}
className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
>
{loading === 'follow'
? 'Loading...'
: isFollowing
? 'Unfollow'
: 'Follow'} </button>

{isFriend ? (
  showUnfriend ? (
    <button
      type="button"
      onClick={handleUnfriend}
      disabled={actionsDisabled}
      className="rounded-lg border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading === 'friend'
        ? 'Unfriending...'
        : 'Unfriend'}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setShowUnfriend(true)}
      disabled={actionsDisabled}
      className="rounded-lg border border-green-300 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Friends
    </button>
  )
) : friendRequestStatus === 'PENDING' &&
  friendRequestDirection === 'RECEIVED' ? (
  <button
    type="button"
    onClick={handleAcceptFriendRequest}
    disabled={actionsDisabled}
    className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading === 'friend'
      ? 'Accepting...'
      : 'Accept Request'}
  </button>
) : (
  <button
    type="button"
    onClick={handleFriendRequest}
    disabled={
      actionsDisabled ||
      isBlocked
    }
    className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading === 'friend'
      ? friendRequestStatus === 'PENDING' &&
        friendRequestDirection === 'SENT'
        ? 'Cancelling...'
        : 'Sending...'
      : friendRequestStatus === 'PENDING' &&
        friendRequestDirection === 'SENT'
        ? 'Cancel Request'
        : 'Add Friend'}
  </button>
)}


  <button
    type="button"
    onClick={handleBlock}
    disabled={
      loading !== null ||
      isBlockedByTarget
    }
    className="rounded-lg border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading === 'block'
      ? 'Loading...'
      : isBlocked
        ? 'Unblock'
        : 'Block'}
  </button>
</div>


);
}
