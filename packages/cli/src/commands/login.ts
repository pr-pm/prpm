/**
 * Login command implementation
 */

import { Command } from 'commander';
import { createServer } from 'http';
import { telemetry } from '../core/telemetry';
import { getConfig, saveConfig } from '../core/user-config';

interface LoginOptions {
  token?: string;
}

/**
 * Start OAuth callback server
 */
function startCallbackServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '', 'http://localhost:8765');

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>❌ Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>✅ Authentication Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);
          server.close();
          resolve(code);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>❌ Invalid Request</h1>
                <p>No authorization code received.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('No authorization code received'));
        }
      }
    });

    server.listen(8765, () => {
      console.log('   Waiting for authentication...');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Exchange OAuth code for JWT token
 */
async function exchangeCodeForToken(code: string, registryUrl: string): Promise<{ token: string; username: string }> {
  const response = await fetch(`${registryUrl}/api/v1/auth/callback?code=${code}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: any = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(error.error || error.message || 'Failed to exchange code for token');
  }

  return (await response.json()) as { token: string; username: string };
}

/**
 * Login with GitHub OAuth
 */
async function loginWithOAuth(registryUrl: string): Promise<{ token: string; username: string }> {
  console.log('\n🔐 Opening browser for GitHub authentication...\n');

  // Open browser to registry OAuth page
  const authUrl = `${registryUrl}/api/v1/auth/github`;
  console.log(`   If browser doesn't open, visit: ${authUrl}\n`);

  // Try to open browser
  const { exec } = await import('child_process');
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${authUrl}"`);

  // Start callback server
  const code = await startCallbackServer();

  // Exchange code for token
  console.log('\n🔄 Exchanging authorization code for token...\n');
  return await exchangeCodeForToken(code, registryUrl);
}

/**
 * Login with manual token
 */
async function loginWithToken(token: string, registryUrl: string): Promise<{ token: string; username: string }> {
  // Verify token by making a request to /api/v1/user
  const response = await fetch(`${registryUrl}/api/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Invalid token');
  }

  const user: any = await response.json();
  return { token, username: user.username };
}

/**
 * Handle login command
 */
export async function handleLogin(options: LoginOptions): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const config = await getConfig();
    const registryUrl = config.registryUrl || 'https://registry.promptpm.dev';

    console.log('🔑 PRMP Login\n');

    let result: { token: string; username: string };

    if (options.token) {
      // Manual token login
      console.log('🔐 Logging in with provided token...\n');
      result = await loginWithToken(options.token, registryUrl);
    } else {
      // OAuth login
      result = await loginWithOAuth(registryUrl);
    }

    // Save token to config
    await saveConfig({
      ...config,
      token: result.token,
      username: result.username,
    });

    console.log('✅ Successfully logged in!\n');
    console.log(`   Username: ${result.username}`);
    console.log(`   Registry: ${registryUrl}\n`);
    console.log('💡 You can now publish packages with "prmp publish"\n');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Login failed: ${error}\n`);
    console.error('💡 Try again or use "prmp login --token YOUR_TOKEN"\n');
    process.exit(1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'login',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        method: options.token ? 'token' : 'oauth',
      },
    });
  }
}

/**
 * Create the login command
 */
export function createLoginCommand(): Command {
  return new Command('login')
    .description('Login to the PRMP registry')
    .option('--token <token>', 'Login with a personal access token')
    .action(handleLogin);
}
