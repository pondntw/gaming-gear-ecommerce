import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { AdminModule } from './admin/admin.controller';
import { AuthModule } from './auth/auth.controller';
import { CartModule } from './cart/cart.controller';
import { CategoriesModule } from './categories/categories.controller';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { OrdersModule } from './orders/orders.controller';
import { PrismaModule } from './prisma/prisma.service';
import { ProductsModule } from './products/products.controller';
import { ReviewsModule } from './reviews/reviews.controller';
import { StorageModule } from './storage/storage.service';
import { UsersModule } from './users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule {}

// Serialize money (Prisma Decimal) as JSON numbers instead of strings.
(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function (this: Prisma.Decimal) {
  return this.toNumber();
};

/** Shared by the local server (main.ts) and the Vercel handler (api/index.ts). */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim());
  app.enableCors({ origin: origins });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  return app;
}
