export interface IUser {
    userId: string;
    email: string;
    password?: string;
    fullName: string;
    refreshToken?: string;
}