import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('/health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('/ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
