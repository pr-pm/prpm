'use client';

import { usePostHog } from 'posthog-js/react';

/**
 * Custom hook for tracking events in PostHog
 * Provides consistent event tracking across the web app
 */
export function useTracking() {
  const posthog = usePostHog();

  return {
    /**
     * Track package page view
     */
    trackPackageView: (packageId: string, packageName: string, author: string) => {
      posthog.capture('package_view', {
        package_id: packageId,
        package_name: packageName,
        author,
        source: 'web',
      });
    },

    /**
     * Track when user clicks install button (copy to clipboard)
     */
    trackPackageInstall: (packageId: string, packageName: string, method: 'cli' | 'curl' | 'npm') => {
      posthog.capture('package_install_click', {
        package_id: packageId,
        package_name: packageName,
        method,
        source: 'web',
      });
    },

    /**
     * Track package search
     */
    trackSearch: (query: string, resultCount: number, filters?: Record<string, any>) => {
      posthog.capture('package_search', {
        query,
        result_count: resultCount,
        filters,
        source: 'web',
      });
    },

    /**
     * Track playground run with package
     */
    trackPlaygroundRun: (packageId: string, packageName: string, model: string, creditsSpent: number) => {
      posthog.capture('playground_run', {
        package_id: packageId,
        package_name: packageName,
        model,
        credits_spent: creditsSpent,
        source: 'web',
      });
    },

    /**
     * Track custom prompt run (no package)
     */
    trackCustomPromptRun: (model: string, creditsSpent: number) => {
      posthog.capture('custom_prompt_run', {
        model,
        credits_spent: creditsSpent,
        feature: 'custom_prompt',
        source: 'web',
      });
    },

    /**
     * Track credit purchase
     */
    trackCreditPurchase: (amount: number, price: number) => {
      posthog.capture('credit_purchase', {
        amount,
        price,
        currency: 'USD',
        source: 'web',
      });
    },

    /**
     * Track subscription start
     */
    trackSubscription: (plan: string, price: number) => {
      posthog.capture('subscription_started', {
        plan,
        price,
        currency: 'USD',
        source: 'web',
      });
    },

    /**
     * Track collection view
     */
    trackCollectionView: (collectionId: string, collectionName: string) => {
      posthog.capture('collection_view', {
        collection_id: collectionId,
        collection_name: collectionName,
        source: 'web',
      });
    },

    /**
     * Track collection install
     */
    trackCollectionInstall: (collectionId: string, collectionName: string) => {
      posthog.capture('collection_install_click', {
        collection_id: collectionId,
        collection_name: collectionName,
        source: 'web',
      });
    },

    /**
     * Track user profile view
     */
    trackProfileView: (username: string) => {
      posthog.capture('profile_view', {
        username,
        source: 'web',
      });
    },

    /**
     * Track GitHub link
     */
    trackGitHubLink: () => {
      posthog.capture('github_link_click', {
        source: 'web',
      });
    },

    /**
     * Track newsletter signup
     */
    trackNewsletterSignup: (email: string) => {
      posthog.capture('newsletter_signup', {
        email,
        source: 'web',
      });
    },

    /**
     * Track generic custom event
     */
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      posthog.capture(eventName, {
        ...properties,
        source: 'web',
      });
    },
  };
}
