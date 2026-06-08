import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, User } from 'src/decorators/customize';
import type { Request, Response } from 'express';
import type { IUser } from '../user/interfaces/user.interface';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterUserDto } from '../user/dto/register-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
        ,
    ) { }

    @Public()
    @Post('login')
    @UseGuards(LocalAuthGuard)
    login(@Req() req, @Res({ passthrough: true }) response) {
        return this.authService.login(req.user, response);
    }

    @Public()
    @Post('register')
    register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }

    @Post('/logout')
    logout(@Res({ passthrough: true }) response: Response, @User() user: IUser) {
        return this.authService.handleLogout(response, user);
    }

    @Get('/refresh-token')
    handleRefreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        const refreshToken: string = request.cookies['refresh_token'];
        return this.authService.processNewToken(refreshToken, response);
    }
}