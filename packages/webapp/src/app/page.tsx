import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-24">
        <div className="z-10 max-w-5xl w-full">
          <div className="text-center mb-16">
            <h1 className="text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-prmp-purple to-prmp-purple-dark bg-clip-text text-transparent">
              PRPM
            </h1>
            <p className="text-2xl lg:text-3xl mb-6 text-gray-600 dark:text-gray-300 font-semibold">
              Prompt Package Manager
            </p>
            <p className="text-lg lg:text-xl mb-12 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              The npm-style package manager for AI coding prompts. Manage, share, and discover
              prompts for Cursor, Claude, Continue, Windsurf, and more.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="https://github.com/khaliqgant/prompt-package-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-prmp-purple text-white rounded-lg hover:bg-prmp-purple-dark transition-colors font-medium text-lg"
              >
                View on GitHub
              </a>
              <Link
                href="/claim"
                className="px-8 py-4 border-2 border-prmp-purple text-prmp-purple rounded-lg hover:bg-prmp-purple hover:text-white transition-colors font-medium text-lg"
              >
                Claim Invite
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">1,042+ Packages</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Curated collection of AI coding prompts from top contributors
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">CLI Tool</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Install and manage prompts with simple npm-like commands
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Search & Discover</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Find the perfect prompt with tags, categories, and filters
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">16 Collections</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Curated package bundles for different use cases
              </p>
            </div>

            <Link href="/authors" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-prpm-purple transition-colors">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Verified Authors</h3>
              <p className="text-gray-600 dark:text-gray-300">
                View the top contributors and claim your packages
              </p>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-2">Version Control</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Semantic versioning with dependency management
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-br from-prmp-purple/10 to-prmp-purple-dark/10 rounded-lg p-8 mb-16 border border-prmp-purple/20">
            <h2 className="text-3xl font-bold mb-6 text-center">Quick Start</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                <div className="mb-2"># Install the CLI</div>
                <div>npm install -g @prmp/cli</div>
              </div>
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                <div className="mb-2"># Search for packages</div>
                <div>prmp search react</div>
              </div>
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                <div className="mb-2"># Install a package</div>
                <div>prmp install @sanjeed5/react-best-practices</div>
              </div>
            </div>
          </div>

          {/* Supported IDEs */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-6">Supports Your Favorite AI Coding Tools</h2>
            <div className="flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔮</span>
                <span className="font-medium">Cursor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="font-medium">Claude</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Continue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌊</span>
                <span className="font-medium">Windsurf</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                <span className="font-medium">Generic</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Have an invite code?
            </p>
            <Link
              href="/claim"
              className="inline-flex items-center gap-2 text-prmp-purple hover:text-prmp-purple-dark text-lg font-semibold"
            >
              Claim your verified author username →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
