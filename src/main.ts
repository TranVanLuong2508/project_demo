import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SharedModule } from './shared/share.module';
import { EnvConfigService } from './shared/services/env-config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CheckDatabaseConnection } from './databases/databaseConnection';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  CheckDatabaseConnection(app);

  const configService = app.select(SharedModule).get(EnvConfigService);

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.use(cookieParser());

  const port = configService.appConfig.port;
  await app.listen(port || 3000);
  logger.warn(`Application is running on: http://localhost:${port || 3000}`);
}

bootstrap();
