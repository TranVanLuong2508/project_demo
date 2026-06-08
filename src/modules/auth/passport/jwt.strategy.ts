import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { EnvConfigService } from 'src/shared/services/env-config.service';
import { IUser } from 'src/modules/user/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: EnvConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.authConfig.access_token_key,
        });
    }

    async validate(payload: IUser) {
        const { userId, fullName, email } = payload;
        return { userId, email, fullName };
    }
}   