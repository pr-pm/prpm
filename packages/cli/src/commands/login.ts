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
 * Login with GitHub OAuth via Nango connect link
 */
async function loginWithOAuth(registryUrl: string): Promise<{ token: string; username: string }> {
  console.log('\n🔐 Opening browser for GitHub authentication...\n');

  // Generate a unique user ID for this CLI session
  const userId = `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get the Nango connect session from the registry
    console.log(`   Connecting to: ${registryUrl}`);

    const response = await fetch(`${registryUrl}/api/v1/auth/nango/cli/connect-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email: 'cli@example.com',
        displayName: 'CLI User',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      throw new Error(`Failed to get authentication session (${response.status}): ${errorText}`);
    }

    const responseData = await response.json() as {
      connectSessionToken: string;
      connect_link?: string;
    };
    
    const { connectSessionToken } = responseData;
    
    if (!connectSessionToken) {
      console.error('❌ No session token received from server');
      console.error('   Response data:', JSON.stringify(responseData, null, 2));
      throw new Error('No session token received from server. Please check your Nango configuration.');
    }
    
    // Create the CLI auth URL with session token, callback, and userId
    const callbackUrl = 'http://localhost:8765/callback';

    // Determine webapp URL - default to production
    const webappUrl = registryUrl.includes('localhost')
      ? registryUrl.replace(':3000', ':5173')  // Local: localhost:3000 → localhost:5173
      : 'https://prpm.dev';                     // Production: always use prpm.dev

    const authUrl = `${webappUrl}/cli-auth?sessionToken=${encodeURIComponent(connectSessionToken)}&cliCallback=${encodeURIComponent(callbackUrl)}&userId=${encodeURIComponent(userId)}`;
    
    console.log(`   Please open this link in your browser to authenticate:`);
    console.log(`   ${authUrl}\n`);

    // Try to open browser
    const { exec } = await import('child_process');
    const platform = process.platform;
    const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} "${authUrl}"`);

    // Poll for authentication completion
    console.log('   Waiting for authentication...\n');
    const result = await pollForAuthentication(registryUrl, userId);

    if (!result.token) {
      throw new Error('No token received from authentication');
    }

    return { token: result.token, username: result.username || 'unknown' };
  } catch (error) {
    if (error instanceof Error) {
      // Check for common network errors
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error(`Cannot connect to registry at ${registryUrl}. Is the registry running?`);
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        throw new Error(`Cannot resolve registry hostname: ${registryUrl}. Check your internet connection.`);
      }
    }
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Poll for authentication completion
 */
async function pollForAuthentication(registryUrl: string, userId: string): Promise<{ token?: string; username?: string }> {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${registryUrl}/api/v1/auth/nango/cli/status/${userId}`);
      
      if (response.ok) {
        const { authenticated, connectionId } = await response.json() as {
          authenticated: boolean;
          connectionId: string | null;
        };
        
        if (authenticated && connectionId) {
          // Authentication completed, get the JWT token
          const statusResponse = await fetch(`${registryUrl}/api/v1/auth/nango/status/${connectionId}`);

          if (statusResponse.ok) {
            const result = await statusResponse.json() as {
              ready: boolean;
              token: string;
              username: string;
            };

            if (result.ready && result.token) {
              return {
                token: result.token,
                username: result.username,
              };
            }
          }
        }
      }
    } catch (error) {
      // Ignore polling errors and continue
    }

    // Wait 5 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Authentication timeout - please try again');
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

  const user = await response.json() as { id: string; username: string; email?: string };
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
    await telemetry.shutdown();
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
