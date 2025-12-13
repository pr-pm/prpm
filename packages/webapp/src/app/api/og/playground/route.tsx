import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface PlaygroundSession {
  package_name: string;
  conversation: Array<{
    role: string;
    content: string;
  }>;
  model: string;
  total_tokens: number;
  helpful_count?: number;
  view_count?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response('Missing token parameter', { status: 400 });
    }

    // Fetch the shared session data
    const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111';
    const response = await fetch(`${registryUrl}/api/v1/playground/shared/${token}`);

    if (!response.ok) {
      return new Response('Session not found', { status: 404 });
    }

    const session: PlaygroundSession = await response.json();

    // Extract user input and assistant response
    const userInput = session.conversation?.[0]?.content || 'Testing prompt...';
    const assistantResponse = session.conversation?.[1]?.content || 'Processing...';

    // Truncate text for display
    const truncate = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    };

    const userInputDisplay = truncate(userInput, 120);
    const responseDisplay = truncate(assistantResponse, 200);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0a0f1a',
            padding: '60px 80px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
            }}
          >
            {/* PRPM Logo & Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                PRPM
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: '#6b7280',
                }}
              >
                Playground
              </div>
            </div>

            {/* Package Name */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ color: '#10b981' }}>📦</span>
              {session.package_name}
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {/* User Input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  color: '#9ca3af',
                  fontWeight: 500,
                }}
              >
                💬 Input:
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: '#e5e7eb',
                  lineHeight: 1.4,
                  padding: '16px 20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderLeft: '4px solid #10b981',
                  borderRadius: '8px',
                }}
              >
                "{userInputDisplay}"
              </div>
            </div>

            {/* Assistant Response Preview */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  color: '#9ca3af',
                  fontWeight: 500,
                }}
              >
                ✨ Result:
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: '#d1d5db',
                  lineHeight: 1.5,
                  padding: '20px 24px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '8px',
                }}
              >
                {responseDisplay}
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              paddingTop: '20px',
              borderTop: '2px solid rgba(107, 114, 128, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '32px',
                fontSize: 18,
                color: '#9ca3af',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤖</span>
                {session.model}
              </div>
              {session.view_count !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👀</span>
                  {session.view_count} views
                </div>
              )}
              {session.helpful_count !== undefined && session.helpful_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👍</span>
                  {session.helpful_count} helpful
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: 20,
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              prpm.dev/playground
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
