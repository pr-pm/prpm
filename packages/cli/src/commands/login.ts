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
function startCallbackServer(): Promise<{ token?: string; username?: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '', 'http://localhost:8765');

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token') || undefined;
        const username = url.searchParams.get('username') || undefined;
        const error = url.searchParams.get('error') || undefined;

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

        if (token) {
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
          resolve({ token, username });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>❌ Invalid Request</h1>
                <p>No token received from authentication.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('No token received'));
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
 * Login with GitHub OAuth
 */
async function loginWithOAuth(registryUrl: string): Promise<{ token: string; username: string }> {
  console.log('\n🔐 Opening browser for GitHub authentication...\n');

  // Open browser to registry OAuth page with CLI redirect
  const callbackUrl = 'http://localhost:8765/callback';
  const authUrl = `${registryUrl}/api/v1/auth/github?redirect=${encodeURIComponent(callbackUrl)}`;
  console.log(`   If browser doesn't open, visit: ${authUrl}\n`);

  // Try to open browser
  const { exec } = await import('child_process');
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${authUrl}"`);

  // Start callback server and receive token directly
  console.log('   Waiting for authentication...\n');
  const result = await startCallbackServer();

  if (!result.token) {
    throw new Error('No token received from authentication');
  }

  // Extract username from token if not provided
  let username = result.username || '';
  if (!username) {
    // Decode JWT to get username (basic JWT decode without verification)
    try {
      const payload = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString());
      username = payload.username || 'unknown';
    } catch (e) {
      username = 'unknown';
    }
  }

  return { token: result.token, username: username || 'unknown' };
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
    const registryUrl = config.registryUrl || 'https://registry.prpm.dev';

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
    console.log('💡 You can now publish packages with "prpm publish"\n');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Login failed: ${error}\n`);
    console.error('💡 Try again or use "prpm login --token YOUR_TOKEN"\n');
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
