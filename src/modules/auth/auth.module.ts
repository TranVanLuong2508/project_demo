import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfigService } from 'src/shared/services/env-config.service';
import { UserModule } from '../user/user.module';
import ms from 'ms';
import { AuthController } from './auth.controller';


@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.registerAsync({
            useFactory: (configService: EnvConfigService) => ({
                secret: configService.authConfig.access_token_key,
                signOptions: {
                    expiresIn: ms(configService.authConfig.access_expiration_time as ms.StringValue) / 1000,
                },
            }),
            inject: [EnvConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule { }
