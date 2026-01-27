import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import { type IHealthIndicator, type HealthCheckResult } from '@core/domain/ports/services';

/**
 * Disk Health Indicator
 *
 * Checks disk space availability.
 *
 * Section 12.3: Health Checks - Resource Thresholds
 * - Warning: > 70%
 * - Critical: > 90%
 */
@Injectable()
export class DiskHealthIndicator implements IHealthIndicator {
  readonly name = 'disk';
  readonly isCritical = false;

  // Thresholds as percentages
  private readonly WARNING_THRESHOLD = 0.7; // 70%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%

  // Path to check (usually the app's working directory)
  private readonly checkPath: string;

  constructor() {
    this.checkPath = process.cwd();
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check if path is accessible
      await fs.promises.access(this.checkPath, fs.constants.R_OK);

      // Get disk space info
      const diskInfo = await this.getDiskSpace();
      const latency = Date.now() - startTime;

      if (!diskInfo) {
        return {
          status: 'healthy',
          latency,
          message: 'Disk space check not supported on this platform',
          metadata: {
            platform: os.platform(),
          },
        };
      }

      const usageRatio = diskInfo.used / diskInfo.total;

      const metadata: Record<string, unknown> = {
        total: this.formatBytes(diskInfo.total),
        used: this.formatBytes(diskInfo.used),
        free: this.formatBytes(diskInfo.free),
        usagePercent: Math.round(usageRatio * 100),
        path: this.checkPath,
      };

      if (usageRatio >= this.CRITICAL_THRESHOLD) {
        return {
          status: 'unhealthy',
          latency,
          message: `Disk usage critical: ${Math.round(usageRatio * 100)}%`,
          metadata,
        };
      }

      if (usageRatio >= this.WARNING_THRESHOLD) {
        return {
          status: 'degraded',
          latency,
          message: `Disk usage high: ${Math.round(usageRatio * 100)}%`,
          metadata,
        };
      }

      return {
        status: 'healthy',
        latency,
        metadata,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown disk error',
      };
    }
  }

  /**
   * Get disk space information
   * Note: This is a simplified implementation
   */
  private async getDiskSpace(): Promise<{ total: number; used: number; free: number } | null> {
    const platform = os.platform();

    // For Windows, we'll return null as getting disk space requires native modules
    // In production, you might use a package like 'check-disk-space'
    if (platform === 'win32') {
      // Return approximate values for Windows
      // In real implementation, use native bindings or exec diskpart/wmic
      return null;
    }

    // For Unix-like systems, use statvfs via fs.statfs (Node 18.15+)
    try {
      const stats = await fs.promises.statfs(this.checkPath);
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;

      return { total, used, free };
    } catch {
      return null;
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }
}
