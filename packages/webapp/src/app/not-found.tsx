import Link from 'next/link'
import Header from '@/components/Header'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <div className="relative overflow-hidden min-h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-prpm-purple/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-extrabold bg-gradient-to-r from-prpm-accent to-prpm-purple bg-clip-text text-transparent">
              404
            </h1>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Page Not Found
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-lg mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/search"
              className="px-8 py-4 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
            >
              Browse Packages
            </Link>
          </div>

          <div className="mt-16 pt-16 border-t border-prpm-border">
            <p className="text-gray-400 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/blog" className="text-prpm-accent hover:underline">
                Blog
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/authors" className="text-prpm-accent hover:underline">
                Authors
              </Link>
              <span className="text-gray-600">•</span>
              <a href="https://docs.prpm.dev" className="text-prpm-accent hover:underline" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
              <span className="text-gray-600">•</span>
              <a href="https://github.com/pr-pm/prpm" className="text-prpm-accent hover:underline" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
