'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import * as jwt from 'jsonwebtoken';

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Optionally disable in development
        // posthog.opt_out_capturing();
      }
    },
  });
}

interface UserData {
  id: string;
  username: string;
  email?: string;
  verified_author?: boolean;
  prpm_plus_status?: string;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get token from localStorage (matching AuthProvider pattern)
    const token = localStorage.getItem('prpm_token');
    const username = localStorage.getItem('prpm_username');

    if (token && token !== 'dev-auto-auth-token' && username) {
      try {
        // Decode JWT to get user_id and email
        const decoded = jwt.decode(token) as {
          user_id: string;
          username: string;
          email: string;
          verified_author?: boolean;
          prpm_plus_status?: string;
        } | null;

        if (decoded && decoded.user_id) {
          // Identify user in PostHog
          posthog.identify(decoded.user_id, {
            username: decoded.username || username,
            email: decoded.email,
            verified_author: decoded.verified_author || false,
            prpm_plus_status: decoded.prpm_plus_status || 'inactive',
          });

          setInitialized(true);
        }
      } catch (error) {
        // Failed to decode token - user might not be logged in or token is invalid
        console.debug('PostHog: Failed to decode token', error);
      }
    } else if (!token) {
      // No token means logged out - reset PostHog
      posthog.reset();
      setInitialized(true);
    } else {
      setInitialized(true);
    }
  }, []);

  // Re-identify if token changes (login/logout)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'prpm_token') {
        if (!e.newValue) {
          // Token removed (logout)
          posthog.reset();
        } else if (e.newValue !== 'dev-auto-auth-token') {
          // Token changed (login)
          try {
            const decoded = jwt.decode(e.newValue) as {
              user_id: string;
              username: string;
              email: string;
              verified_author?: boolean;
              prpm_plus_status?: string;
            } | null;

            if (decoded && decoded.user_id) {
              posthog.identify(decoded.user_id, {
                username: decoded.username,
                email: decoded.email,
                verified_author: decoded.verified_author || false,
                prpm_plus_status: decoded.prpm_plus_status || 'inactive',
              });
            }
          } catch (error) {
            console.debug('PostHog: Failed to decode token on storage change', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
