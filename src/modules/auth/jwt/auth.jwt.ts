import { Logger, Req } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { SECRETS } from 'src/common/constant/constant'
import { User } from '../types/user.type'
export class AuthJwt extends PassportStrategy(Strategy, 'auth-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AuthJwt.stractJwtRequest,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: SECRETS.JWT,
      ignoreExpiration: true,
    })
  }

  private static stractJwtRequest(@Req() req: Request): string | null {
    Logger.debug({ cookies: req.cookies })
    if (req.cookies && req.cookies.auth) return req.cookies.auth
    return null
  }
  async validate(user: User) {
    return user
  }
}
