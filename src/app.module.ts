import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { SharedModule } from './shared/share.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvConfigService } from './shared/services/env-config.service';
import { AuthModule } from './modules/auth/auth.module';
import { ShopifyModule } from './modules/shopify/shopify.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      inject: [EnvConfigService],
      useFactory: (configService: EnvConfigService): TypeOrmModuleOptions =>
        configService.postgresConfig as TypeOrmModuleOptions,
    }),
    UserModule,
    SharedModule,
    AuthModule,
    ShopifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
