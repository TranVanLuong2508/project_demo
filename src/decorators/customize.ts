import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

//   @Public() Decorator to make a route public (without token)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//   @User() Decorator to get user from request
export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
});

//   @SkipCheckPermission() Decorator to skip check role (RBAC)
export const IS_PUBLIC_PERMISSION = 'isPublicPermission';
export const SkipCheckPermission = () => SetMetadata(IS_PUBLIC_PERMISSION, true);