import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE_ORM = 'DRIZZLE_ORM';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_ORM,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          user: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'restaurant_os'),
        });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE_ORM],
})
export class DrizzleModule {}
