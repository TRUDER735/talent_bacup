import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const dbUri = configService.get<string>('DB_URI');
                if (!dbUri) {
                    throw new Error('DB_URI environment variable is required');
                }

                return {
                    type: 'mongodb',
                    url: dbUri,
                    synchronize: configService.get<string>('NODE_ENV') !== 'production',
                    autoLoadEntities: true,
                    retryWrites: true,
                    w: 'majority',
                    // Connection pool settings for production
                    maxPoolSize: 10,
                    minPoolSize: 2,
                    maxIdleTimeMS: 30000,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    // Logging
                    logging: configService.get<string>('NODE_ENV') === 'development' ? 'all' : ['error'],
                };
            },
        }),
    ],
})
export class DatabaseModule { }
