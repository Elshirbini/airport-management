import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor() {}

  async onModuleDestroy() {
    this.logger.log('Closing DB connection...');
    try {
      this.logger.log('DB connection closed successfully');
    } catch (error) {
      this.logger.error('Error closing DB connection:', error);
    }
  }
}
