import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import helmet from 'helmet';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const allowedOriginsRaw = process.env.ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsRaw
      ? allowedOriginsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const app = await NestFactory.create(AppModule, {
      cors: {
        origin: allowedOrigins.length ? allowedOrigins : true,
        credentials: true,
      },
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    
    // Compression middleware
    app.use(compression());

    // Global exception filter to prevent container crashes
    app.useGlobalFilters(new AllExceptionsFilter());
    // Global logging interceptor for request/response tracing
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Set global prefix for API routes
    app.setGlobalPrefix('talent');

    // Body parser configuration with proper limits
    app.use('/talent', (req, res, next) => {
      if (req.originalUrl.includes('/upload')) {
        // Higher limit for file uploads
        req.setTimeout(300000); // 5 minutes timeout for uploads
      }
      next();
    });

    // Global validation pipe with enhanced configuration
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }));

    const configService = app.get(ConfigService);

    // Consistent port resolution - prioritize environment variable
    const APP_PORT = parseInt(process.env.APP_PORT || '4001') || configService.get<number>('APP_PORT') || 4001;

    // Swagger docs (only in non-production environments)
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Uncommon Talent Market API')
        .setDescription('The Uncommon Talent Market API description')
        .setVersion('1.0')
        .addTag('uncommon-talent')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
      logger.log(`📚 Swagger docs available at: http://0.0.0.0:${APP_PORT}/docs`);
    }

    // Environment validation
    const requiredEnvVars = process.env.NODE_ENV === 'production' 
      ? ['DB_URI', 'JWT_SECRET'] 
      : ['DB_URI']; // JWT_SECRET optional in development
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
      process.exit(1);
    }

    // Set default JWT_SECRET for development
    if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
      process.env.JWT_SECRET = 'development-jwt-secret-key-not-for-production-use';
      logger.warn('⚠️  Using default JWT_SECRET for development. Set JWT_SECRET environment variable for production.');
    }

    // Startup logging
    logger.log('⚡ Starting Uncommon Talent API...');
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🚀 Port: ${APP_PORT}`);
    logger.log(`📊 Database: ${process.env.DB_URI ? '✅ Connected' : '❌ Missing'}`);
    logger.log(`🔐 JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
    logger.log(`📧 Email: ${process.env.SMTP_HOST ? '✅ Configured' : '❌ Missing'}`);
    logger.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
    
    // Debug environment variables in production
    if (process.env.NODE_ENV === 'production') {
      logger.log('🔍 Production Environment Debug:');
      logger.log(`DB_URI length: ${process.env.DB_URI?.length || 0}`);
      logger.log(`JWT_SECRET length: ${process.env.JWT_SECRET?.length || 0}`);
      logger.log(`Available env vars: ${Object.keys(process.env).filter(key => key.includes('DB_') || key.includes('JWT_') || key.includes('APP_')).join(', ')}`);
    }

    // Start server on localhost for development
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    await app.listen(APP_PORT, host);
    
    logger.log(`🚀 Server running on http://${host}:${APP_PORT}`);
    logger.log(`📋 API endpoints: http://${host}:${APP_PORT}/talent/`);
    logger.log(`💚 Health check: http://${host}:${APP_PORT}/talent/health`);
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Enhanced error handling to prevent container crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack trace:', error.stack);
  // Log the error but don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
