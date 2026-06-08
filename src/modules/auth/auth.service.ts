import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUser } from '../user/interfaces/user.interface';
import { JwtService } from '@nestjs/jwt';
import ms, { StringValue } from 'ms';
import { Response } from 'express';
// import { RegisterUserDto } from 'src/modules/users/dto/register-user.dto';
import { EnvConfigService } from 'src/shared/services/env-config.service';
import { RegisterUserDto } from '../user/dto/register-user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private configService: EnvConfigService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            const isValidPassword = this.usersService.isValidPassword(pass, user.password);
            if (isValidPassword) {

                const { password, refreshToken, ...result } = user;

                return { success: true, message: "Valid information", user: result };
            }
        }
        return { success: false, message: 'Invalid username or password' };
    }

    generateRefreshToken = (payload: any) => {
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.authConfig.refresh_token_key,
            expiresIn: ms(this.configService.authConfig.refresh_expiration_time as StringValue) / 1000,
        });
        return { success: true, message: 'Create refresh token successfully', refreshToken };
    };

    async login(user: any, response: Response) {
        const { userId, email, fullName } = user;
        const payload = {
            iss: 'from server',
            sub: 'token login',
            userId,
            email,
            fullName,
        };
        //generate refresh token
        const refresh_token = this.generateRefreshToken(payload);
        await this.usersService.updateUserToken(refresh_token.refreshToken, userId);

        response.cookie('refresh_token', refresh_token.refreshToken, {
            httpOnly: true,
            maxAge: ms(this.configService.authConfig.refresh_expiration_time as StringValue),
        });
        return {
            success: true,
            message: 'Login successfully',
            access_token: this.jwtService.sign(payload),
            user: {
                userId,
                email,
                fullName,
            },
        };
    }

    async register(user: RegisterUserDto) {
        return await this.usersService.register(user);
    }

    async handleLogout(respones: Response, user: IUser) {
        await this.usersService.updateUserToken('', user.userId);
        respones.clearCookie('refresh_token');
        return { success: true, message: 'Logout ok' };
    }

    createRefreshToken = (payload: any) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.authConfig.refresh_token_key,
            expiresIn: ms(this.configService.authConfig.refresh_expiration_time as StringValue) / 1000,
        });
        return { success: true, message: 'Create refresh token successfully', refresh_token };
    };

    async processNewToken(refreshToken: string, response: Response) {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.authConfig.refresh_token_key,
            });

            const user = await this.usersService.findUserByRefreshToken(refreshToken);
            if (user) {
                const { userId, email, fullName } = user;
                const payload = {
                    iss: 'from server',
                    sub: 'token login',
                    userId,
                    email,
                    fullName,
                };
                const refresh_token = this.createRefreshToken(payload);

                await this.usersService.updateUserToken(refresh_token.refresh_token, userId);

                response.clearCookie('refresh_token');
                response.cookie('refresh_token', refresh_token.refresh_token, {
                    httpOnly: true,
                    maxAge: ms(this.configService.authConfig.refresh_expiration_time as StringValue),
                });
                return {
                    success: true,
                    message: 'Get new token successfully',
                    access_token: this.jwtService.sign(payload),
                    user: {
                        userId,
                        email,
                        fullName,
                    },
                };
            } else {
                throw new BadRequestException(`Refresh token invalid. Please log in`);
            }
        } catch (error) {
            throw new BadRequestException('Refresh token invalid. Please log in.');
        }
    }
}