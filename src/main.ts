import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersMiddleware } from './dapr/middleware/security-headers.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // Security headers middleware
  app.use(new SecurityHeadersMiddleware().use);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Signature', 'X-Timestamp'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
  );

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Restaurant OS API')
      .setDescription('Restaurant Operating System Backend API Documentation with Dapr Security Integration')
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for service-to-service authentication',
        },
        'API-Key',
      )
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Tenants', 'Tenant management endpoints')
      .addTag('Profiles', 'User profile management endpoints')
      .addTag('Menu Items', 'Menu item management endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Storage', 'File upload and storage endpoints')
      .addTag('Security', 'Dapr security features')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation available at: /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Dapr Integration: ${process.env.USE_DAPR === 'true' ? 'Enabled' : 'Disabled'}`);
}
bootstrap();
