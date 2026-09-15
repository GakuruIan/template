import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AcceptInvitationDto } from './dto/invitation.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

import type { AuthUser } from 'src/auth/types/auth-session.type';
import { Permissions } from 'src/permissions/decorators/permissions.decorator';
import { getAuthorizedBranchScope } from 'src/common/utils/branch-access.util';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationsService) {}

  @UseGuards(AuthGuard)
  @Permissions('invitations:view')
  @Get('/list')
  async listInvitations(@CurrentUser() user: AuthUser) {
    const branchId = getAuthorizedBranchScope(user);

    return this.invitationService.list(branchId);
  }

  @Get('/verify')
  async verify(@Query('token') token: string) {
    return this.invitationService.verify(token);
  }

  @UseGuards(AuthGuard)
  // @Permissions('invitations:accept')
  @Post('/accept-invitation')
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationService.acceptInvitation(dto);
  }

  @UseGuards(AuthGuard)
  @Permissions('invitations:revoke')
  @Post('/revoke/:invitationId')
  async revokeInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const branchId = getAuthorizedBranchScope(user);

    return this.invitationService.revokeInvitation(
      invitationId,
      user.id,
      branchId,
    );
  }
}
