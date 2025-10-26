import Link from 'next/link'

interface BlogFooterProps {
  postTitle: string
  postUrl: string
}

export default function BlogFooter({ postTitle, postUrl }: BlogFooterProps) {
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(`https://prpm.dev${postUrl}`)}&via=prpmdev`

  return (
    <footer className="mt-12 pt-8 border-t border-prpm-border">
      <div className="flex items-center justify-between">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Share this post:</span>
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#1DA1F2] transition-colors"
            aria-label="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
