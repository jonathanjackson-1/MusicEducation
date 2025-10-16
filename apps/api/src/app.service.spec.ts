import { AppService } from './app.service';

describe('AppService', () => {
  it('should return health payload', () => {
    const service = new AppService();
    const health = service.getHealth();
    expect(health.status).toBe('ok');
  });
});
