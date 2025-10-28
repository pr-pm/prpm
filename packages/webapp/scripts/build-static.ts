#!/usr/bin/env tsx
/**
 * Build script for static site generation
 *
 * Usage:
 *   npm run build:static              # Uses production registry
 *   npm run build:static:local        # Uses local registry
 *   npm run build:static:staging      # Uses staging registry
 *
 * Environment variables:
 *   REGISTRY_URL - Override registry URL
 *   NODE_ENV - Set to 'production' for production build
 */

import { spawn } from 'child_process'
import * as path from 'path'

// Environment configurations
const ENVIRONMENTS = {
  local: {
    REGISTRY_URL: 'http://localhost:3000',
    NEXT_PUBLIC_REGISTRY_URL: 'http://localhost:3000',
  },
  staging: {
    REGISTRY_URL: 'https://staging-registry.prpm.dev',
    NEXT_PUBLIC_REGISTRY_URL: 'https://staging-registry.prpm.dev',
  },
  production: {
    REGISTRY_URL: 'https://registry.prpm.dev',
    NEXT_PUBLIC_REGISTRY_URL: 'https://registry.prpm.dev',
  },
}

// Parse command line arguments
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
const environment = envArg ? envArg.split('=')[1] : 'production'

if (!['local', 'staging', 'production'].includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`)
  console.error('   Valid options: local, staging, production')
  process.exit(1)
}

const envConfig = ENVIRONMENTS[environment as keyof typeof ENVIRONMENTS]

console.log(`\n🚀 Building static site for ${environment.toUpperCase()} environment`)
console.log(`📡 Registry URL: ${envConfig.REGISTRY_URL}\n`)

// Check if registry is accessible (for local/staging)
async function checkRegistryHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`)
    return response.ok
  } catch (error) {
    return false
  }
}

async function main() {
  // Health check for non-production environments
  if (environment !== 'production') {
    console.log(`🔍 Checking registry health at ${envConfig.REGISTRY_URL}...`)
    const isHealthy = await checkRegistryHealth(envConfig.REGISTRY_URL)

    if (!isHealthy) {
      console.error(`\n❌ Registry not accessible at ${envConfig.REGISTRY_URL}`)
      console.error('   Make sure the registry is running before building.\n')

      if (environment === 'local') {
        console.error('   Start the registry with: npm run dev --workspace=@pr-pm/registry\n')
      }

      process.exit(1)
    }

    console.log('✅ Registry is healthy\n')
  }

  // Step 1: Generate sitemap before building
  console.log('🗺️  Generating sitemap...\n')

  const sitemapProcess = spawn('tsx', ['scripts/generate-sitemap.ts', `--env=${environment}`], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  })

  await new Promise<void>((resolve, reject) => {
    sitemapProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Sitemap generated successfully!\n')
        resolve()
      } else {
        console.error(`\n❌ Sitemap generation failed with code ${code}\n`)
        reject(new Error('Sitemap generation failed'))
      }
    })

    sitemapProcess.on('error', (error) => {
      reject(error)
    })
  })

  // Step 2: Prepare environment variables
  const env = {
    ...process.env,
    ...envConfig,
    NODE_ENV: 'production',
  }

  // Step 3: Run Next.js build
  console.log('📦 Running Next.js build...\n')

  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: 'inherit',
    shell: true,
  })

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Build completed successfully!')
      console.log(`\n📊 Build stats:`)
      console.log(`   Environment: ${environment}`)
      console.log(`   Registry: ${envConfig.REGISTRY_URL}`)
      console.log(`   Output: ./out`)
      console.log(`   Sitemap: ./out/sitemap.xml\n`)

      if (environment === 'local') {
        console.log('💡 To test locally:')
        console.log('   npx serve out')
        console.log('   Sitemap: http://localhost:3000/sitemap.xml\n')
      }
    } else {
      console.error(`\n❌ Build failed with code ${code}\n`)
      process.exit(code || 1)
    }
  })

  buildProcess.on('error', (error) => {
    console.error(`\n❌ Build error: ${error.message}\n`)
    process.exit(1)
  })
}

main().catch((error) => {
  console.error(`\n❌ Unexpected error: ${error.message}\n`)
  process.exit(1)
})
