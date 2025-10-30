'use client'

import { useState } from 'react'

interface Benefit {
  icon: string
  title: string
  description: string
  category: 'core' | 'publishing' | 'team' | 'analytics' | 'support'
}

const benefits: Benefit[] = [
  // Core Features
  {
    icon: '✓',
    title: 'Verified Badge',
    description: 'Display the verified checkmark on your organization and all packages',
    category: 'core',
  },
  {
    icon: '💎',
    title: 'Discounted PRPM+ for Members',
    description: 'Team members get discounted access to PRPM+ premium features',
    category: 'team',
  },
  {
    icon: '🎨',
    title: 'Custom Avatar URL',
    description: 'Upload your brand logo and display it across the platform',
    category: 'core',
  },
  {
    icon: '🏅',
    title: 'Priority Ranking',
    description: 'Boosted visibility in search results and leaderboards',
    category: 'core',
  },

  // Publishing Features
  {
    icon: '🔒',
    title: 'Private Packages',
    description: 'Publish unlimited private packages for internal use only',
    category: 'publishing',
  },
  {
    icon: '📦',
    title: 'Auto-Verified Packages',
    description: 'All packages you publish are automatically verified',
    category: 'publishing',
  },
  {
    icon: '⭐',
    title: 'Featured Package Slots',
    description: 'Get 2 packages featured on the homepage',
    category: 'publishing',
  },
  {
    icon: '🚀',
    title: 'Larger Package Limits',
    description: 'Upload packages up to 100MB (vs 10MB for free)',
    category: 'publishing',
  },

  // Team Features
  {
    icon: '👥',
    title: 'Expanded Team Size',
    description: 'Add up to 20 team members (vs 5 for free)',
    category: 'team',
  },
  {
    icon: '🔐',
    title: 'Role-Based Permissions',
    description: 'Granular access control for team members',
    category: 'team',
  },
  {
    icon: '��',
    title: 'Audit Logs',
    description: 'Track all team member activities and changes',
    category: 'team',
  },

  // Analytics Features
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Real-time download metrics, geographic data, and usage patterns',
    category: 'analytics',
  },
  {
    icon: '📈',
    title: 'Trend Insights',
    description: 'Version adoption rates and user retention metrics',
    category: 'analytics',
  },
  {
    icon: '💾',
    title: 'Data Exports',
    description: 'Export analytics data as CSV/JSON for your own analysis',
    category: 'analytics',
  },

  // Support Features
  {
    icon: '⚡',
    title: 'Priority Support',
    description: '24-hour response time vs 7 days for free users',
    category: 'support',
  },
  {
    icon: '💬',
    title: 'Direct Messaging',
    description: 'Support inbox to communicate directly with your users',
    category: 'support',
  },
  {
    icon: '🎓',
    title: 'Exclusive Resources',
    description: 'Access to webinars, tutorials, and best practices guides',
    category: 'support',
  },
]

const categoryTitles = {
  core: 'Core Benefits',
  publishing: 'Publishing & Packages',
  team: 'Team Collaboration',
  analytics: 'Analytics & Insights',
  support: 'Support & Resources',
}

interface VerifiedPlanBenefitsProps {
  showPricing?: boolean
  compact?: boolean
}

export default function VerifiedPlanBenefits({ showPricing = true, compact = false }: VerifiedPlanBenefitsProps) {
  const [expanded, setExpanded] = useState(false)

  const groupedBenefits = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = []
    }
    acc[benefit.category].push(benefit)
    return acc
  }, {} as Record<string, Benefit[]>)

  if (compact) {
    const displayedBenefits = expanded ? benefits : benefits.slice(0, 6)

    return (
      <div className="space-y-3">
        {displayedBenefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-prpm-accent/20 rounded-full flex items-center justify-center text-prpm-accent text-sm">
              {benefit.icon}
            </span>
            <div>
              <p className="text-white font-medium text-sm">{benefit.title}</p>
              <p className="text-gray-400 text-xs">{benefit.description}</p>
            </div>
          </div>
        ))}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-prpm-accent hover:text-prpm-accent-light text-xs text-center pt-2 w-full transition-colors"
          >
            + {benefits.length - 6} more features
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-500 hover:text-gray-400 text-xs text-center pt-2 w-full transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {showPricing && (
        <div className="text-center pb-6 border-b border-prpm-border">
          <div className="inline-flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold text-white">$20</span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-gray-400 text-sm">Billed monthly • Cancel anytime</p>
        </div>
      )}

      {Object.entries(groupedBenefits).map(([category, categoryBenefits]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {categoryTitles[category as keyof typeof categoryTitles]}
          </h3>
          <div className="space-y-4">
            {categoryBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-prpm-accent/20 rounded-lg flex items-center justify-center text-prpm-accent text-xl">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">{benefit.title}</h4>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-prpm-accent/10 border border-prpm-accent/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="text-white font-semibold mb-2">Why Upgrade?</h4>
            <p className="text-gray-400 text-sm">
              Join verified organizations building trust with their community. Get premium features
              to grow your presence, collaborate with your team, and gain insights into your audience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
