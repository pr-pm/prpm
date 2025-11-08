import { Command } from 'commander';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

export function createTelemetryCommand() {
  return new Command('telemetry')
    .description('Manage telemetry and analytics settings')
    .addCommand(createStatusCommand(), { hidden: true})
    .addCommand(createEnableCommand())
    .addCommand(createDisableCommand())
    .addCommand(createStatsCommand(), { hidden: true })
    .addCommand(createTestCommand(), { hidden: true })
}

function createStatusCommand() {
  return new Command('status')
    .description('Show current telemetry status')
    .action(async () => {
      const enabled = telemetry.isEnabled();
      const stats = await telemetry.getStats();

      console.log('📊 Telemetry Status:');
      console.log(`   Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Analytics: 📈 PostHog`);
      console.log(`   Total events: ${stats.totalEvents}`);
      if (stats.lastEvent) {
        console.log(`   Last event: ${stats.lastEvent}`);
      }

      if (enabled) {
        console.log('\n💡 Telemetry helps us improve the tool by collecting anonymous usage data.');
        console.log('   Data is sent to PostHog for analysis.');
        console.log('   Run "prpm telemetry disable" to opt out.');
      } else {
        console.log('\n💡 Telemetry is disabled. Run "prpm telemetry enable" to help improve the tool.');
      }
      throw new CLIError('', 0);
    });
}

function createEnableCommand() {
  return new Command('enable')
    .description('Enable telemetry and analytics')
    .action(async () => {
      await telemetry.enable();
      console.log('✅ Telemetry enabled');
      console.log('📊 Anonymous usage data will be collected to help improve the tool.');
      throw new CLIError('', 0);
    });
}

function createDisableCommand() {
  return new Command('disable')
    .description('Disable telemetry and analytics')
    .action(async () => {
      await telemetry.disable();
      console.log('❌ Telemetry disabled');
      console.log('📊 No usage data will be collected.');
      throw new CLIError('', 0);
    });
}

function createStatsCommand() {
  return new Command('stats')
    .description('Show telemetry statistics')
    .action(async () => {
      const stats = await telemetry.getStats();
      console.log('📊 Telemetry Statistics:');
      console.log(`   Total events: ${stats.totalEvents}`);
      if (stats.lastEvent) {
        console.log(`   Last event: ${stats.lastEvent}`);
      }
      throw new CLIError('', 0);
    });
}

function createTestCommand() {
  return new Command('test')
    .description('Send a test event to PostHog')
    .action(async () => {
      console.log('🧪 Sending test event to PostHog...');
      
      try {
        await telemetry.track({
          command: 'test',
          success: true,
          duration: 100,
          data: {
            testType: 'manual',
            message: 'This is a test event from PPM CLI',
            timestamp: new Date().toISOString(),
            uniqueId: Math.random().toString(36).substring(7),
          },
        });
        
        console.log('✅ Test event sent successfully!');
        console.log('📈 Check your PostHog dashboard for the event: prpm_test');
        console.log('🔗 Dashboard: https://app.posthog.com');
        console.log('⏰ Note: Events may take 1-2 minutes to appear in the dashboard');
        
        // Wait a moment for the event to be sent
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const stats = await telemetry.getStats();
        console.log(`📊 Total events now: ${stats.totalEvents}`);
        
        console.log('\n🔍 Troubleshooting tips:');
        console.log('1. Check the "Live Events" section in PostHog');
        console.log('2. Look for events with name "prpm_test"');
        console.log('3. Make sure you\'re in the correct PostHog project');
        console.log('4. Events may take 1-2 minutes to appear');
        
      } catch (error) {
        throw new CLIError(`❌ Failed to send test event: ${error}`, 1);
      }
      throw new CLIError('', 0);
    });
}
