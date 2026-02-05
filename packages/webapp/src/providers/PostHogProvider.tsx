'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import * as jwt from 'jsonwebtoken';

interface UserData {
  id: string;
  username: string;
  email?: string;
  verified_author?: boolean;
  prpm_plus_status?: string;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const didInit = useRef(false);

  useEffect(() => {
    // Initialize PostHog after hydration to avoid DOM modifications during hydration
    if (didInit.current) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    didInit.current = true;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      // Session replay configuration for screen recordings
      session_recording: {
        recordCrossOriginIframes: false, // Don't record cross-origin iframes
        maskAllInputs: false, // Don't mask all inputs by default (selectively mask sensitive ones)
        maskTextSelector: '[data-ph-mask]', // Use data attribute for sensitive fields
        maskInputOptions: {
          password: true, // Always mask password fields
          email: false, // Show emails (already authenticated users)
          color: false,
          date: false,
          'datetime-local': false,
          month: false,
          number: false,
          range: false,
          search: false,
          tel: false,
          text: false,
          time: false,
          url: false,
          week: false,
          textarea: false,
          select: false,
        },
      },
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Optionally disable in development
          // posthog.opt_out_capturing();
        }
      },
    });

    // Identify user if logged in
    const token = localStorage.getItem('prpm_token');
    const username = localStorage.getItem('prpm_username');

    if (token && token !== 'dev-auto-auth-token' && username) {
      try {
        const decoded = jwt.decode(token) as {
          user_id: string;
          username: string;
          email: string;
          verified_author?: boolean;
          prpm_plus_status?: string;
        } | null;

        if (decoded && decoded.user_id) {
          posthog.identify(decoded.user_id, {
            username: decoded.username || username,
            email: decoded.email,
            verified_author: decoded.verified_author || false,
            prpm_plus_status: decoded.prpm_plus_status || 'inactive',
          });
        }
      } catch (error) {
        console.debug('PostHog: Failed to decode token', error);
      }
    } else if (!token) {
      posthog.reset();
    }
  }, []);

  // Re-identify if token changes (login/logout)
  useEffect(() => {
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
