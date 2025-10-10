import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { PostHog } from 'posthog-node';

export interface TelemetryEvent {
  timestamp: string;
  command: string;
  version: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  success: boolean;
  error?: string;
  duration?: number;
  // Command-specific data
  data?: Record<string, any>;
}

export interface TelemetryConfig {
  enabled: boolean;
  userId?: string;
  sessionId: string;
}

class Telemetry {
  private config: TelemetryConfig;
  private configPath: string;
  private events: TelemetryEvent[] = [];
  private readonly maxEvents = 100; // Keep only last 100 events locally
  private posthog: PostHog | null = null;

  constructor() {
    this.configPath = path.join(os.homedir(), '.prmp', 'telemetry.json');
    this.config = this.loadConfig();
    this.initializePostHog();
  }

  private initializePostHog(): void {
    try {
      this.posthog = new PostHog('phc_aO5lXLILeylHfb1ynszVwKbQKSzO91UGdXNhN5Q0Snl', {
        host: 'https://app.posthog.com',
        flushAt: 1, // Send events immediately
        flushInterval: 0, // No batching
      });
    } catch (error) {
      this.posthog = null;
    }
  }

  private loadConfig(): TelemetryConfig {
    try {
      const data = require(this.configPath);
      return {
        enabled: data.enabled ?? true, // Default to enabled
        userId: data.userId,
        sessionId: data.sessionId || this.generateSessionId(),
      };
    } catch {
      return {
        enabled: true,
        sessionId: this.generateSessionId(),
      };
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async saveConfig(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      // Silently fail - telemetry shouldn't break the CLI
    }
  }

  async track(event: Omit<TelemetryEvent, 'timestamp' | 'version' | 'platform' | 'arch' | 'nodeVersion'>): Promise<void> {
    if (!this.config.enabled) return;

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
    };

    this.events.push(fullEvent);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Save events locally
    await this.saveEvents();

    // Send to analytics service (async, non-blocking)
    this.sendToAnalytics(fullEvent).catch(() => {
      // Silently fail - don't break the CLI
    });
  }

  private async saveEvents(): Promise<void> {
    try {
      const eventsPath = path.join(os.homedir(), '.prmp', 'events.json');
      await fs.mkdir(path.dirname(eventsPath), { recursive: true });
      await fs.writeFile(eventsPath, JSON.stringify(this.events, null, 2));
    } catch (error) {
      // Silently fail
    }
  }

  private async sendToAnalytics(event: TelemetryEvent): Promise<void> {
    // Send to PostHog
    await this.sendToPostHog(event);
  }

  async enable(): Promise<void> {
    this.config.enabled = true;
    await this.saveConfig();
  }

  async disable(): Promise<void> {
    this.config.enabled = false;
    await this.saveConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async getStats(): Promise<{ totalEvents: number; lastEvent?: string }> {
    try {
      const eventsPath = path.join(os.homedir(), '.prmp', 'events.json');
      const data = await fs.readFile(eventsPath, 'utf8');
      const savedEvents = JSON.parse(data);
      return {
        totalEvents: savedEvents.length,
        lastEvent: savedEvents[savedEvents.length - 1]?.timestamp,
      };
    } catch (error) {
      return {
        totalEvents: this.events.length,
        lastEvent: this.events[this.events.length - 1]?.timestamp,
      };
    }
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      try {
        await this.posthog.shutdown();
      } catch (error) {
        // Silently fail
      }
    }
  }

  // Send to PostHog
  private async sendToPostHog(event: TelemetryEvent): Promise<void> {
    if (!this.posthog) return;

    try {
      const distinctId = this.config.userId || this.config.sessionId || 'anonymous';
      
      this.posthog.capture({
        distinctId,
        event: `prmp_${event.command}`,
        properties: {
          // Core event data
          command: event.command,
          success: event.success,
          duration: event.duration,
          error: event.error,
          
          // System information
          version: event.version,
          platform: event.platform,
          arch: event.arch,
          nodeVersion: event.nodeVersion,
          
          // Command-specific data
          ...event.data,
          
          // Metadata
          timestamp: event.timestamp,
          sessionId: this.config.sessionId,
        },
      });
      // Event sent to PostHog
    } catch (error) {
      // Silently fail - don't break the CLI
    }
  }
}

export const telemetry = new Telemetry();
