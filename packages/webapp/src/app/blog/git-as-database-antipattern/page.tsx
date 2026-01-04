import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Why Every Package Manager Abandoned Git - And How PRPM Avoided The Trap",
  description: "Cargo, Homebrew, CocoaPods, and Go all started with git registries. They all regretted it. Here's why PRPM chose HTTP from day one.",
  openGraph: {
    title: "Why Every Package Manager Abandoned Git - And How PRPM Avoided The Trap",
    description: "The hidden costs of using git as a package registry database—and the architecture that avoids them.",
  },
}

export default function GitAsDatabaseAntipatternPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Architecture', 'Registry']}
          title="Why Every Package Manager Abandoned Git - And How PRPM Avoided The Trap"
          author="PRPM Team"
          date="January 4, 2026"
          readTime="8 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Cargo, Homebrew, CocoaPods, Go modules—every major package manager that started with a git-based registry eventually abandoned it. The pattern is so consistent it's almost predictable. Here's why it fails, and how PRPM designed around these problems from the first commit.
            </p>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Git is brilliant for version control. It's terrible for databases. But when you're building a package registry from scratch, it's tempting: git gives you versioning, free hosting on GitHub, and a familiar mental model. It seems like the perfect fit.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Until it isn't.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Graveyard: Who Switched and Why</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Let's look at the evidence. These aren't hypothetical problems—they're production failures that forced migrations.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Cargo (Rust): Clone Times Became Unbearable</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Cargo started with crates.io-index, a git repository containing metadata for every published crate. Every <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">cargo install</code> required cloning or updating this repository.
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              As the registry grew, so did the pain:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Fresh clones took minutes on slow connections</li>
              <li>Delta resolution consumed gigabytes of disk space</li>
              <li>Users downloaded the entire registry history just to check one package's latest version</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">The fix:</strong> Sparse HTTP index. Instead of cloning a git repo, Cargo now fetches individual package metadata files over HTTPS. As of April 2025, <strong className="text-white">99% of users have migrated</strong> to sparse indices because the performance difference is night and day.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Homebrew: Git Performance Hit a Wall</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Homebrew's formula repository became a bottleneck as the number of packages grew. Running <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">brew update</code> meant pulling the latest commits from a massive git repo.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">The fix:</strong> JSON API served via HTTP with aggressive CDN caching. Formula metadata is now delivered as lightweight JSON files instead of git objects.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">CocoaPods: Directory Limits Broke Performance</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              The CocoaPods Specs repository hit <strong className="text-white">16,000+ pod directories</strong>. Git performance degraded catastrophically as filesystem operations slowed to a crawl.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">The fix:</strong> CDN-based podspec delivery. Instead of maintaining a git repo with thousands of directories, CocoaPods now serves specs from a CDN-backed HTTP API.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Go Modules: Security + Performance</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Go initially relied on git repositories for module resolution. But this had two critical problems:
            </p>

            <ul className="text-gray-300 space-y-3 mb-6 list-disc ml-6">
              <li><strong className="text-white">Performance:</strong> Fetching modules directly from git was slow and unreliable</li>
              <li><strong className="text-white">Security:</strong> Force-push attacks could replace legitimate code with malicious versions</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">The fix:</strong> GOPROXY for HTTP-based module delivery plus a checksum database (sum.golang.org) to guarantee immutability. Git tags can be rewritten; cryptographic checksums cannot.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Still Suffering: vcpkg and Nixpkgs</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Not everyone has migrated yet. <strong className="text-white">vcpkg</strong> (C++ packages) and <strong className="text-white">Nixpkgs</strong> still use massive git repositories.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              The pain shows: developers complain about slow clones, disk usage, and git operations that take seconds when they should be instant.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why Git Fails as a Database</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            The pattern is consistent because the root causes are structural. Git wasn't designed for this workload.
          </p>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Problem</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Full history downloads</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">Users download years of commits just to install one package</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Delta resolution</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">CPU and disk thrash as git reconstructs objects from deltas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Directory limits</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">Filesystem operations degrade with thousands of subdirectories</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Case sensitivity chaos</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">macOS (case-insensitive) vs Linux (case-sensitive) causes corruption</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">No database features</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">No constraints, no indexes, no locking, no schema migrations</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Force-push vulnerability</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">History rewriting can replace legitimate packages with malware</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            These aren't edge cases. They're fundamental mismatches between what git optimizes for (tracking source code changes) and what a package registry needs (fast, immutable, indexed metadata lookups).
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How PRPM Avoided This From Day One</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            We didn't discover these problems through painful experience. We learned from everyone else's mistakes and designed accordingly.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. HTTP-Based Registry, Not Git</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              PRPM's registry is a standard REST API backed by PostgreSQL. No git repositories anywhere in the critical path.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">
{`GET /api/v1/packages/react-best-practices
GET /api/v1/packages/react-best-practices/1.2.0
GET /api/v1/search?q=react`}
              </code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Simple. Fast. CDN-cacheable. No delta resolution, no clone times, no merge conflicts.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Individual Package Fetching</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              When you run <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm install react-rules</code>, PRPM downloads <strong className="text-white">exactly one tarball</strong>—not the entire registry.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">
{`📥 Installing react-rules@2.1.0...
⬇️  Downloading...
🔒 Verifying integrity...
✓ Integrity verified
📂 Extracting...`}
              </code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              You're not cloning a 500MB repo to install a 12KB file. The download size is proportional to what you actually need.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. PostgreSQL for Metadata, S3 for Packages</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Package metadata lives in PostgreSQL with proper indexes, constraints, and full-text search. Package tarballs live in S3-compatible storage.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <ul className="space-y-3 text-gray-300 list-disc ml-6">
                <li><strong className="text-white">Metadata queries:</strong> PostgreSQL with pg_trgm for fuzzy search (milliseconds)</li>
                <li><strong className="text-white">Version resolution:</strong> Database indexes, not git log traversal</li>
                <li><strong className="text-white">Package downloads:</strong> S3 tarballs with CDN caching</li>
                <li><strong className="text-white">Integrity checks:</strong> SHA-256 checksums in prpm.lock</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-8">
              This is the architecture that Cargo, Homebrew, and Go all converged on. We started there.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Immutability via Checksums, Not Git Tags</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Published packages are immutable. Once <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">react-rules@1.2.0</code> is published, that version is locked forever.
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              Your <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm.lock</code> file contains cryptographic hashes:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">
{`{
  "packages": {
    "react-rules": {
      "version": "1.2.0",
      "integrity": "sha256-abc123...",
      "format": "cursor"
    }
  }
}`}
              </code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              If someone compromises the registry and tries to replace a package, the integrity check fails. No force-push attacks. No history rewriting. Just math.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Lessons</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            If you're building a package registry in 2026, don't use git as your database. It will work fine for the first 100 packages. Then 1,000. Then it will become a bottleneck you can't fix without a migration.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            The right architecture isn't novel—it's proven:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>HTTP API for metadata</li>
            <li>Proper database with indexes and constraints</li>
            <li>CDN-backed package storage</li>
            <li>Cryptographic integrity checks</li>
            <li>Sparse/on-demand fetching</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM followed this playbook from commit one. We didn't reinvent package management—we applied the lessons that Cargo, Homebrew, CocoaPods, and Go learned the hard way.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Git is brilliant. Just not for this.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Want to See How It Works?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Install PRPM and experience the difference of a registry built right from the start.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/search"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                Browse Packages
              </Link>
              <a
                href="https://github.com/pr-pm/prpm"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              >
                View Source
              </a>
            </div>
          </div>
        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
