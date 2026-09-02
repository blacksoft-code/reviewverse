import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Follow a user',
  })
  @ApiResponse({
    status: 201,
    description: 'User followed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Already following this user',
  })
  followUser(
    @Param('id') targetUserId: string,
    @Req() req: any,
  ) {
    return this.usersService.followUser(
      req.user.userId,
      targetUserId,
    );
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Unfollow a user',
  })
  @ApiResponse({
    status: 200,
    description: 'User unfollowed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Follow relationship not found',
  })
  unfollowUser(
    @Param('id') targetUserId: string,
    @Req() req: any,
  ) {
    return this.usersService.unfollowUser(
      req.user.userId,
      targetUserId,
    );
  }

 @Post(':id/friend-request')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Send a friend request',
})
@ApiResponse({
  status: 201,
  description: 'Friend request sent successfully',
})
@ApiResponse({
  status: 400,
  description: 'Cannot send request to yourself',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
@ApiResponse({
  status: 409,
  description: 'Friend request already exists',
})
sendFriendRequest(
  @Param('id') targetUserId: string,
  @Req() req: any,
) {
  return this.usersService.sendFriendRequest(
    req.user.userId,
    targetUserId,
  );
}
@Patch('friend-request/:id/accept')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Accept a friend request',
})
@ApiResponse({
  status: 200,
  description: 'Friend request accepted successfully',
})
@ApiResponse({
  status: 400,
  description: 'User is not the receiver or request is already processed',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'Friend request not found',
})
acceptFriendRequest(
  @Param('id') requestId: string,
  @Req() req: any,
) {
  return this.usersService.acceptFriendRequest(
    req.user.userId,
    requestId,
  );
}

@Patch('friend-request/:id/reject')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Reject a friend request',
})
@ApiResponse({
  status: 200,
  description: 'Friend request rejected successfully',
})
@ApiResponse({
  status: 400,
  description: 'User is not the receiver or request is already processed',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'Friend request not found',
})
rejectFriendRequest(
  @Param('id') requestId: string,
  @Req() req: any,
) {
  return this.usersService.rejectFriendRequest(
    req.user.userId,
    requestId,
  );
}

@Delete('friend-request/:requestId')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Cancel a sent friend request',
})
@ApiResponse({
  status: 200,
  description: 'Friend request cancelled successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'Friend request not found',
})
cancelFriendRequest(
  @Param('requestId') requestId: string,
  @Req() req: any,
) {
  return this.usersService.cancelFriendRequest(
    req.user.userId,
    requestId,
  );
}

@Get('friend-requests')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Get pending friend requests',
})
@ApiResponse({
  status: 200,
  description: 'Pending friend requests retrieved successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
getPendingFriendRequests(
  @Req() req: any,
) {
  return this.usersService.getPendingFriendRequests(
    req.user.userId,
  );
}

@Get(':id')
@ApiOperation({
  summary: 'Get user profile',
})
@ApiResponse({
  status: 200,
  description: 'User profile retrieved successfully',
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
getUserProfile(
  @Param('id') userId: string,
) {
  return this.usersService.getUserProfile(userId);
}

@Get(':id/friends')
@ApiOperation({
  summary: 'Get user friends',
})
@ApiResponse({
  status: 200,
  description: 'Friends retrieved successfully',
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
getFriends(
  @Param('id') userId: string,
) {
  return this.usersService.getFriends(userId);
}

@Get(':id/relationship')
@UseGuards(JwtAuthGuard)
@ApiOperation({
summary: 'Get relationship with a user',
})
@ApiResponse({
status: 200,
description: 'Relationship retrieved successfully',
})
@ApiResponse({
status: 401,
description: 'Unauthorized',
})
@ApiResponse({
status: 404,
description: 'User not found',
})
getRelationship(
@Param('id') targetUserId: string,
@Req() req: any,
) {
return this.usersService.getRelationship(
req.user.userId,
targetUserId,
);
}


@Delete(':id/unfriend')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Unfriend a user',
})
@ApiResponse({
  status: 200,
  description: 'User unfriended successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'Friendship not found',
})
unfriendUser(
  @Param('id') targetUserId: string,
  @Req() req: any,
) {
  return this.usersService.unfriendUser(
    req.user.userId,
    targetUserId,
  );
}



@Post(':id/block')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Block a user',
})
@ApiResponse({
  status: 201,
  description: 'User blocked successfully',
})
@ApiResponse({
  status: 400,
  description: 'Cannot block yourself',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
@ApiResponse({
  status: 409,
  description: 'User already blocked',
})
blockUser(
  @Param('id') targetUserId: string,
  @Req() req: any,
) {
  return this.usersService.blockUser(
    req.user.userId,
    targetUserId,
  );
}

@Delete(':id/unblock')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Unblock a user',
})
@ApiResponse({
  status: 200,
  description: 'User unblocked successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 404,
  description: 'User is not blocked',
})
unblockUser(
  @Param('id') targetUserId: string,
  @Req() req: any,
) {
  return this.usersService.unblockUser(
    req.user.userId,
    targetUserId,
  );
}

//last brac
}

