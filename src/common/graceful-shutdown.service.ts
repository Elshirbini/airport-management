import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleDestroy() {
    this.logger.log('Closing DB connection...');
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
      this.logger.log('DB connection closed successfully');
    } catch (error) {
      this.logger.error('Error closing DB connection:', error);
    }
  }
}
