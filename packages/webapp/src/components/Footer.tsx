import Link from 'next/link'

interface FooterProps {
  backLink?: string
  backText?: string
}

export default function Footer({ backLink = '/', backText = 'Back to Home' }: FooterProps = {}) {
  return (
    <footer className="mt-12 pt-8 border-t border-prpm-border">
      <div className="flex items-center justify-between">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backText}
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <Link href="/legal/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
