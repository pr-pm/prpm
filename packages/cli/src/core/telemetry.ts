import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { PostHog } from 'posthog-node';
import { getConfig } from './user-config';

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
  private userConfigChecked = false;
  private userTelemetryEnabled = true; // Default to true until checked

  constructor() {
    this.configPath = path.join(os.homedir(), '.prpm', 'telemetry.json');
    this.config = this.loadConfig();
  }

  private async checkUserConfig(): Promise<void> {
    if (this.userConfigChecked) return;

    try {
      const userConfig = await getConfig();
      this.userTelemetryEnabled = userConfig.telemetryEnabled ?? true;
    } catch (error) {
      // If we can't load user config, default to enabled
      this.userTelemetryEnabled = true;
    }

    this.userConfigChecked = true;
  }

  private async initializePostHog(): Promise<void> {
    // Check user config first
    await this.checkUserConfig();

    // Only initialize if telemetry is enabled in user config
    if (!this.userTelemetryEnabled) {
      this.posthog = null;
      return;
    }

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

  /**
   * Load userId from user config and update telemetry config
   */
  private async loadUserIdFromConfig(): Promise<void> {
    try {
      const userConfig = await getConfig();
      if (userConfig.userId && userConfig.userId !== this.config.userId) {
        this.config.userId = userConfig.userId;
        await this.saveConfig();
      }
    } catch {
      // Silently fail - telemetry shouldn't break the CLI
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
    // Check user config first
    await this.checkUserConfig();

    // Return early if telemetry is disabled in user config
    if (!this.userTelemetryEnabled) return;

    if (!this.config.enabled) return;

    // Load userId from user config before tracking
    await this.loadUserIdFromConfig();

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
      const eventsPath = path.join(os.homedir(), '.prpm', 'events.json');
      await fs.mkdir(path.dirname(eventsPath), { recursive: true });
      await fs.writeFile(eventsPath, JSON.stringify(this.events, null, 2));
    } catch (error) {
      // Silently fail
    }
  }

  private async sendToAnalytics(event: TelemetryEvent): Promise<void> {
    // Initialize PostHog if needed (this will check user config)
    if (!this.posthog && this.userTelemetryEnabled) {
      await this.initializePostHog();
    }

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

  async isEnabled(): Promise<boolean> {
    await this.checkUserConfig();
    return this.userTelemetryEnabled && this.config.enabled;
  }

  async getStats(): Promise<{ totalEvents: number; lastEvent?: string }> {
    try {
      const eventsPath = path.join(os.homedir(), '.prpm', 'events.json');
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
        // Flush any pending events before shutdown
        await this.posthog.flush();
        await this.posthog.shutdown();
      } catch (error) {
        // Silently fail
      } finally {
        this.posthog = null;
      }
    }
  }

  /**
   * Identify user in PostHog with user properties
   * Called after successful login to set user attributes
   */
  async identifyUser(userId: string, traits: Record<string, any>): Promise<void> {
    if (!this.posthog || !this.config.enabled) return;

    try {
      // Update local config with userId
      this.config.userId = userId;
      await this.saveConfig();

      // Send $identify event to PostHog
      this.posthog.identify({
        distinctId: userId,
        properties: traits,
      });

      // Also capture the $identify event explicitly
      this.posthog.capture({
        distinctId: userId,
        event: '$identify',
        properties: traits,
      });

      // Flush immediately to ensure identification happens
      await this.posthog.flush();
    } catch (error) {
      // Silently fail - telemetry shouldn't break the CLI
    }
  }

  // Send to PostHog
  private async sendToPostHog(event: TelemetryEvent): Promise<void> {
    if (!this.posthog) return;

    try {
      const distinctId = this.config.userId || this.config.sessionId || 'anonymous';

      this.posthog.capture({
        distinctId,
        event: `prpm_${event.command}`,
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
