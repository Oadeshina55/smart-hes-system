import cron from 'node-cron';
import { meterCommService } from './meterComm.service';
import { Meter } from '../models/Meter.model';

export class MeterSchedulerService {
  private readingJob: cron.ScheduledTask | null = null;
  private healthCheckJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  /**
   * Start automatic meter reading scheduler
   * Default: Every 30 minutes
   */
  startAutoReading(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.warn('⚠️  Meter reading scheduler already running');
      return;
    }

    // Convert minutes to cron expression
    const cronExpression = this.getCronExpression(intervalMinutes);

    this.readingJob = cron.schedule(cronExpression, async () => {
      console.log('🔄 Starting scheduled meter reading...');
      await this.readAllMeters();
    });

    // Also start health check every 5 minutes
    this.healthCheckJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkMeterHealth();
    });

    this.isRunning = true;
    console.log(`⏰ Meter reading scheduler started (every ${intervalMinutes} minutes)`);
    console.log(`❤️  Health check scheduler started (every 5 minutes)`);
  }

  /**
   * Convert minutes to cron expression
   */
  private getCronExpression(minutes: number): string {
    if (minutes === 60) {
      return '0 * * * *'; // Every hour
    } else if (minutes === 30) {
      return '*/30 * * * *'; // Every 30 minutes
    } else if (minutes === 15) {
      return '*/15 * * * *'; // Every 15 minutes
    } else {
      return `*/${minutes} * * * *`; // Custom interval
    }
  }

  /**
   * Read all active meters
   */
  async readAllMeters(): Promise<void> {
    try {
      if (!meterCommService.isConnected()) {
        console.error('❌ MQTT not connected. Skipping meter reading.');
        return;
      }

      // Get all active meters
      const meters = await Meter.find({
        status: 'active',
        isActive: true,
      }).select('meterNumber serialNumber customerNetwork');

      if (meters.length === 0) {
        console.log('ℹ️  No active meters to read');
        return;
      }

      console.log(`📡 Reading ${meters.length} meters...`);

      let successCount = 0;
      let failCount = 0;

      // Read meters in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < meters.length; i += batchSize) {
        const batch = meters.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (meter) => {
            try {
              await meterCommService.readMeter(meter.meterNumber);
              successCount++;

              // Small delay between commands
              await this.delay(100);
            } catch (error) {
              console.error(`Failed to read meter ${meter.meterNumber}:`, error);
              failCount++;
            }
          })
        );

        // Delay between batches
        if (i + batchSize < meters.length) {
          await this.delay(1000);
        }
      }

      console.log(
        `✅ Scheduled meter reading completed: ${successCount} successful, ${failCount} failed`
      );
    } catch (error) {
      console.error('❌ Error in scheduled reading:', error);
    }
  }

  /**
   * Check health of meters (detect offline meters)
   */
  async checkMeterHealth(): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Find meters that haven't communicated in the last 5 minutes
      const offlineMeters = await Meter.find({
        status: 'active',
        isActive: true,
        lastCommunication: { $lt: fiveMinutesAgo },
      }).select('meterNumber lastCommunication');

      if (offlineMeters.length > 0) {
        console.log(`⚠️  ${offlineMeters.length} meters appear offline`);

        // Update their status
        for (const meter of offlineMeters) {
          await Meter.findByIdAndUpdate(meter._id, {
            connectionStatus: 'offline',
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking meter health:', error);
    }
  }

  /**
   * Read a specific meter on demand
   */
  async readSingleMeter(meterId: string): Promise<boolean> {
    try {
      if (!meterCommService.isConnected()) {
        throw new Error('MQTT not connected');
      }

      const meter = await Meter.findOne({ meterNumber: meterId });
      if (!meter) {
        throw new Error(`Meter ${meterId} not found`);
      }

      if (!meter.isActive || meter.status !== 'active') {
        throw new Error(`Meter ${meterId} is not active`);
      }

      await meterCommService.readMeter(meterId);
      console.log(`📡 Manual read command sent to meter ${meterId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error reading meter ${meterId}:`, error);
      throw error;
    }
  }

  /**
   * Read all meters in a specific customer network
   */
  async readNetworkMeters(networkId: string): Promise<void> {
    try {
      const meters = await Meter.find({
        customerNetwork: networkId,
        status: 'active',
        isActive: true,
      }).select('meterNumber');

      console.log(`📡 Reading ${meters.length} meters in network...`);

      for (const meter of meters) {
        try {
          await meterCommService.readMeter(meter.meterNumber);
          await this.delay(100);
        } catch (error) {
          console.error(`Failed to read meter ${meter.meterNumber}:`, error);
        }
      }

      console.log(`✅ Network meter reading completed`);
    } catch (error) {
      console.error('❌ Error reading network meters:', error);
      throw error;
    }
  }

  /**
   * Control meter (connect/disconnect)
   */
  async controlMeter(meterId: string, action: 'connect' | 'disconnect'): Promise<boolean> {
    try {
      if (!meterCommService.isConnected()) {
        throw new Error('MQTT not connected');
      }

      const meter = await Meter.findOne({ meterNumber: meterId });
      if (!meter) {
        throw new Error(`Meter ${meterId} not found`);
      }

      await meterCommService.controlMeter(meterId, action);
      console.log(`⚡ ${action} command sent to meter ${meterId}`);

      // Update meter status in database
      await Meter.findByIdAndUpdate(meter._id, {
        connectionStatus: action === 'connect' ? 'connected' : 'disconnected',
      });

      return true;
    } catch (error) {
      console.error(`❌ Error controlling meter ${meterId}:`, error);
      throw error;
    }
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Stop all schedulers
   */
  stop(): void {
    if (this.readingJob) {
      this.readingJob.stop();
      this.readingJob = null;
    }

    if (this.healthCheckJob) {
      this.healthCheckJob.stop();
      this.healthCheckJob = null;
    }

    this.isRunning = false;
    console.log('⏸️  Meter schedulers stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      mqttConnected: meterCommService.isConnected(),
    };
  }
}

// Export singleton instance
export const meterScheduler = new MeterSchedulerService();
