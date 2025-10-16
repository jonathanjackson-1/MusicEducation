import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, TenantContextService],
  exports: [PrismaService, TenantContextService],
})
export class PrismaModule {}
