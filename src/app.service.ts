import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): { message: string; version: string; environment: string } {
    const appConfig = this.configService.get<AppConfig>('app');

    return {
      message: `Welcome to ${appConfig?.name || 'NestJS Boilerplate'}!`,
      version: appConfig?.version || '1.0.0',
      environment: appConfig?.nodeEnv || 'development',
    };
  }
}
