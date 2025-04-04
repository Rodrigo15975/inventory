import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { ListUserDto } from './dto/list-user.dto'
import { GetUserPayloadToken } from 'src/common/decorators/user.decorator'
import { User } from '../auth/types/user.type'
import { AuthUserGuard } from '../auth/guards/auth.guard'

@Controller({
  path: 'user',
  version: VERSION_NEUTRAL,
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createOrUpdate({
      ...createUserDto,
      name: createUserDto.name.toLowerCase(),
    })
  }

  @UseGuards(AuthUserGuard)
  @Get('list')
  list(@Query() listUserDto: ListUserDto) {
    return this.userService.list(listUserDto)
  }

  @UseGuards(AuthUserGuard)
  @Get('profile')
  profile(@GetUserPayloadToken() user: User) {
    return this.userService.findOne(user.user_id)
  }

  @UseGuards(AuthUserGuard)
  @Get('list-all')
  findAll() {
    return this.userService.findAll()
  }

  @UseGuards(AuthUserGuard)
  @Patch('update/:id_user')
  update(
    @Body() createUserDto: CreateUserDto,
    @Param('id_user') id_user: string,
  ) {
    return this.userService.createOrUpdate(
      {
        ...createUserDto,
        name: createUserDto.name.toLowerCase(),
      },
      id_user,
    )
  }

  @UseGuards(AuthUserGuard)
  @Delete(':id_user')
  remove(@Param('id_user') id_user: string) {
    return this.userService.remove(id_user)
  }
}
