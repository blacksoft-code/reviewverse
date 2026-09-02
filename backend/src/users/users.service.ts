import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

 async followUser(
  currentUserId: string,
  targetUserId: string,
) {
  console.log('FOLLOW START');
  console.log('currentUserId:', currentUserId);
  console.log('targetUserId:', targetUserId);

  if (currentUserId === targetUserId) {
    throw new BadRequestException(
      'You cannot follow yourself.',
    );
  }

  const targetUser = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  console.log('TARGET USER:', targetUser);

  if (!targetUser || !targetUser.isActive) {
    throw new NotFoundException(
      'User not found.',
    );
  }

  const existingFollow =
    await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

  console.log('EXISTING FOLLOW:', existingFollow);

  if (existingFollow) {
    throw new ConflictException(
      'You are already following this user.',
    );
  }

  try {
    const follow = await this.prisma.userFollow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    console.log('FOLLOW CREATED:', follow);

    return follow;
  } catch (error) {
    console.error('FOLLOW ERROR:', error);
    throw error;
  }
}

  async unfollowUser(
    currentUserId: string,
    targetUserId: string,
  ) {
    const existingFollow =
      await this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });

    if (!existingFollow) {
      throw new NotFoundException(
        'You are not following this user.',
      );
    }

    await this.prisma.userFollow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return {
      message: 'User unfollowed successfully.',
    };
  }
  async sendFriendRequest(
  currentUserId: string,
  targetUserId: string,
) {
  if (currentUserId === targetUserId) {
    throw new BadRequestException(
      'You cannot send a friend request to yourself.',
    );
  }

  const targetUser = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!targetUser || !targetUser.isActive) {
    throw new NotFoundException(
      'User not found.',
    );
  }

  const existingRequest =
    await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: currentUserId,
            receiverId: targetUserId,
          },
          {
            senderId: targetUserId,
            receiverId: currentUserId,
          },
        ],
      },
    });

  if (existingRequest) {
    throw new ConflictException(
      'A friend request already exists between these users.',
    );
  }

  return this.prisma.friendRequest.create({
    data: {
      senderId: currentUserId,
      receiverId: targetUserId,
    },
  });
}

async acceptFriendRequest(
  currentUserId: string,
  requestId: string,
) {
  const request =
    await this.prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Friend request not found.',
    );
  }

  if (request.receiverId !== currentUserId) {
    throw new BadRequestException(
      'Only the receiver can accept this friend request.',
    );
  }

  if (request.status !== 'PENDING') {
    throw new BadRequestException(
      'This friend request has already been processed.',
    );
  }

  const userId1 =
    request.senderId < request.receiverId
      ? request.senderId
      : request.receiverId;

  const userId2 =
    request.senderId < request.receiverId
      ? request.receiverId
      : request.senderId;
//
  const result =
  await this.prisma.$transaction(async (tx) => {
    const friendship =
      await tx.friendship.create({
        data: {
          userId1,
          userId2,
        },
      });

    await tx.friendRequest.delete({
      where: {
        id: requestId,
      },
    });

    return {
      friendship,
    };
  });
//
  return result;
}



async getFriends(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new NotFoundException(
      'User not found.',
    );
  }

  const friendships =
    await this.prisma.friendship.findMany({
      where: {
        OR: [
          {
            userId1: userId,
          },
          {
            userId2: userId,
          },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

  const friends = friendships.map(
    (friendship) => {
      if (friendship.userId1 === userId) {
        return friendship.user2;
      }

      return friendship.user1;
    },
  );

  return {
    id: user.id,
    name: user.name,
    friendCount: friends.length,
    friends,
  };
}

async unfriendUser(
  currentUserId: string,
  targetUserId: string,
) {
  if (currentUserId === targetUserId) {
    throw new BadRequestException(
      'You cannot unfriend yourself.',
    );
  }

  const friendship =
    await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userId1: currentUserId,
            userId2: targetUserId,
          },
          {
            userId1: targetUserId,
            userId2: currentUserId,
          },
        ],
      },
    });

  if (!friendship) {
    throw new NotFoundException(
      'Friendship not found.',
    );
  }

  await this.prisma.friendship.delete({
    where: {
      id: friendship.id,
    },
  });

  return {
    message: 'User unfriended successfully.',
  };
}
async getPendingFriendRequests(
  userId: string,
) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new NotFoundException(
      'User not found.',
    );
  }

  return this.prisma.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING',
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async rejectFriendRequest(
  currentUserId: string,
  requestId: string,
) {
  const request =
    await this.prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Friend request not found.',
    );
  }

  if (request.receiverId !== currentUserId) {
    throw new BadRequestException(
      'You can only reject requests sent to you.',
    );
  }

  if (request.status !== 'PENDING') {
    throw new BadRequestException(
      'This friend request is no longer pending.',
    );
  }

  await this.prisma.friendRequest.delete({
  where: {
    id: requestId,
  },
});

return {
  message: 'Friend request rejected successfully.',
};

}
async cancelFriendRequest(
  currentUserId: string,
  requestId: string,
) {
  const request =
    await this.prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Friend request not found.',
    );
  }

  if (request.senderId !== currentUserId) {
    throw new BadRequestException(
      'You can only cancel requests sent by you.',
    );
  }

  if (request.status !== 'PENDING') {
    throw new BadRequestException(
      'This friend request is no longer pending.',
    );
  }

  await this.prisma.friendRequest.delete({
    where: {
      id: requestId,
    },
  });

  return {
    message: 'Friend request cancelled successfully.',
  };
}

async blockUser(
  currentUserId: string,
  targetUserId: string,
) {
  if (currentUserId === targetUserId) {
    throw new BadRequestException(
      'You cannot block yourself.',
    );
  }

  const targetUser = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!targetUser || !targetUser.isActive) {
    throw new NotFoundException(
      'User not found.',
    );
  }

  const existingBlock =
    await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

  if (existingBlock) {
    throw new ConflictException(
      'You have already blocked this user.',
    );
  }

  const block = await this.prisma.userBlock.create({
    data: {
      blockerId: currentUserId,
      blockedId: targetUserId,
    },
  });

  await this.prisma.userFollow.deleteMany({
    where: {
      OR: [
        {
          followerId: currentUserId,
          followingId: targetUserId,
        },
        {
          followerId: targetUserId,
          followingId: currentUserId,
        },
      ],
    },
  });

  return block;
}

async unblockUser(
  currentUserId: string,
  targetUserId: string,
) {
  const existingBlock =
    await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

  if (!existingBlock) {
    throw new NotFoundException(
      'User is not blocked.',
    );
  }

  await this.prisma.userBlock.delete({
    where: {
      id: existingBlock.id,
    },
  });

  return {
    message: 'User unblocked successfully.',
  };
}

async getUserProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      reviews: {
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          entity: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException('User not found.');
  }

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
    reviewCount: user.reviews.length,
    reviews: user.reviews,
  };
}

async getRelationship(
currentUserId: string,
targetUserId: string,
) {
if (currentUserId === targetUserId) {
return {
isFollowing: false,
isFollower: false,
isFriend: false,
 friendRequestId: null,
friendRequestStatus: null,
friendRequestDirection: null,
isBlocked: false,
isBlockedByTarget: false,
};
}

const [
following,
follower,
friendship,
friendRequest,
blocked,
blockedByTarget,
] = await Promise.all([
this.prisma.userFollow.findUnique({
where: {
followerId_followingId: {
followerId: currentUserId,
followingId: targetUserId,
},
},
}),


this.prisma.userFollow.findUnique({
  where: {
    followerId_followingId: {
      followerId: targetUserId,
      followingId: currentUserId,
    },
  },
}),

this.prisma.friendship.findFirst({
  where: {
    OR: [
      {
        userId1: currentUserId,
        userId2: targetUserId,
      },
      {
        userId1: targetUserId,
        userId2: currentUserId,
      },
    ],
  },
}),

this.prisma.friendRequest.findFirst({
  where: {
    OR: [
      {
        senderId: currentUserId,
        receiverId: targetUserId,
      },
      {
        senderId: targetUserId,
        receiverId: currentUserId,
      },
    ],
  },
  orderBy: {
    createdAt: 'desc',
  },
}),

this.prisma.userBlock.findUnique({
  where: {
    blockerId_blockedId: {
      blockerId: currentUserId,
      blockedId: targetUserId,
    },
  },
}),

this.prisma.userBlock.findUnique({
  where: {
    blockerId_blockedId: {
      blockerId: targetUserId,
      blockedId: currentUserId,
    },
  },
}),


]);

let friendRequestStatus: string | null = null;
let friendRequestDirection:
| 'SENT'
| 'RECEIVED'
| null = null;

if (friendRequest) {
friendRequestStatus = friendRequest.status;


if (
  friendRequest.senderId ===
  currentUserId
) {
  friendRequestDirection = 'SENT';
} else {
  friendRequestDirection = 'RECEIVED';
}


}

return {
isFollowing: !!following,
isFollower: !!follower,
isFriend: !!friendship,
friendRequestId: friendRequest?.id ?? null,
friendRequestStatus,
friendRequestDirection,
isBlocked: !!blocked,
isBlockedByTarget: !!blockedByTarget,
};
}

//last brac
}