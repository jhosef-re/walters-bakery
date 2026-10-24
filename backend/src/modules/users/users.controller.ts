import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import {
  ChangePasswordDto,
  CreateUserDto,
  ListUsersQuery,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // --- rutas autenticadas auto-servicio ---

  @Get('me/profile')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findByIdOrThrow(user.id);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changeMyPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const updated = await this.users.changeOwnPassword(
      user,
      dto.passwordActual,
      dto.passwordNueva,
    );
    return { ok: true, debeCambiarPassword: updated.debeCambiarPassword };
  }

  // --- rutas admin ---

  @Get()
  @Roles(Rol.administrador_general)
  findAll(@Query() query: ListUsersQuery) {
    return this.users.findAll(query);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get(':id')
  findOne(@Param() params: IdParamDto) {
    return this.users.findByIdOrThrow(params.id);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.users.update(params.id, dto, actor.id);
  }

  @Post(':id/reset-password')
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param() params: IdParamDto,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.users.resetPassword(params.id, dto, actor.id);
  }

  @Patch(':id/deactivate')
  @Roles(Rol.administrador_general)
  deactivate(
    @Param() params: IdParamDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.users.deactivate(params.id, actor.id);
  }
}
