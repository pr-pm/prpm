/**
 * CI Test OpenCode Plugin
 * Tests installation to .opencode/plugin/
 */

export default {
  name: 'ci-test-plugin',
  version: '1.0.0',
  description: 'CI Test OpenCode Plugin for PRPM integration testing',

  activate() {
    console.log('CI test plugin activated');
  },

  deactivate() {
    console.log('CI test plugin deactivated');
  }
};
