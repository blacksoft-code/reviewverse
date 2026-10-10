import {
  Body,
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
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { UpdateFriendPrivacyDto } from './dto/update-friend-privacy.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

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

@Get('blocked')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Get users I have blocked',
})
@ApiResponse({
  status: 200,
  description: 'Blocked users retrieved successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
getBlockedUsers(
  @Req() req: any,
) {
  return this.usersService.getBlockedUsers(
    req.user.userId,
  );
}

@Get('blocked-entities')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Get entities (businesses) I have blocked',
})
getBlockedEntities(
  @Req() req: any,
) {
  return this.usersService.getBlockedEntities(
    req.user.userId,
  );
}

@Get('me/privacy')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Get my friend list privacy setting',
})
getMyFriendPrivacy(
  @Req() req: any,
) {
  return this.usersService.getFriendPrivacy(
    req.user.userId,
  );
}

@Patch('me/privacy')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Update my friend list privacy (PUBLIC / FRIENDS / PRIVATE)',
})
@ApiResponse({
  status: 200,
  description: 'Privacy updated successfully',
})
updateMyFriendPrivacy(
  @Body() dto: UpdateFriendPrivacyDto,
  @Req() req: any,
) {
  return this.usersService.updateFriendPrivacy(
    req.user.userId,
    dto,
  );
}

@Get(':id')
@UseGuards(OptionalJwtAuthGuard)
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
  @Req() req: any,
) {
  return this.usersService.getUserProfile(
    userId,
    req.user?.userId ?? null,
  );
}

@Patch('me/info')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({
  summary:
    'Update your own profile info (work, study, location, birthday, gender, bio)',
})
@ApiResponse({
  status: 200,
  description: 'Profile info updated successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
updateMyInfo(
  @Body() dto: UpdateUserInfoDto,
  @Req() req: any,
) {
  return this.usersService.updateUserInfo(
    req.user.userId,
    dto,
  );
}

@Get(':id/friends')
@UseGuards(OptionalJwtAuthGuard)
@ApiOperation({
  summary: 'Get user friends (respects friend list privacy)',
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
  @Req() req: any,
) {
  return this.usersService.getFriendsForViewer(
    req.user?.userId ?? null,
    userId,
  );
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
@Get('entity/:entityId/status')
@UseGuards(JwtAuthGuard)
getEntityRelationshipStatus(
  @Req() req: any,
  @Param('entityId') entityId: string,
) {
  return this.usersService.getEntityRelationshipStatus(
    req.user.userId,
    entityId,
  );
}
//follow entity
@Post('entity/:entityId/follow')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Follow entity',
})
@ApiResponse({
  status: 201,
  description: 'Entity followed successfully',
})
followEntity(
  @Req() req: any,
  @Param('entityId') entityId: string,
) {
  return this.usersService.followEntity(
    req.user.userId,
    entityId,
  );
}


@Delete('entity/:entityId/unfollow')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Unfollow entity',
})
@ApiResponse({
  status: 200,
  description: 'Entity unfollowed successfully',
})
unfollowEntity(
  @Req() req: any,
  @Param('entityId') entityId: string,
) {
  return this.usersService.unfollowEntity(
    req.user.userId,
    entityId,
  );
}

@Post('entity/:entityId/block')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Block entity',
})
@ApiResponse({
  status: 201,
  description: 'Entity blocked successfully',
})
blockEntity(
  @Req() req: any,
  @Param('entityId') entityId: string,
) {
  return this.usersService.blockEntity(
    req.user.userId,
    entityId,
  );
}

@Delete('entity/:entityId/unblock')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Unblock entity',
})
@ApiResponse({
  status: 200,
  description: 'Entity unblocked successfully',
})
unblockEntity(
  @Req() req: any,
  @Param('entityId') entityId: string,
) {
  return this.usersService.unblockEntity(
    req.user.userId,
    entityId,
  );
}
//last brac
}

