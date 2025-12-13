import { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { token?: string };
}): Promise<Metadata> {
  const token = searchParams?.token;

  if (!token) {
    return {
      title: 'Shared Playground Result | PRPM',
      description: 'See how AI prompts perform in the PRPM Playground',
    };
  }

  try {
    // Fetch the shared session data for metadata
    const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111';
    const response = await fetch(`${registryUrl}/api/v1/playground/shared/${token}`, {
      cache: 'no-store', // Don't cache metadata fetches
    });

    if (!response.ok) {
      return {
        title: 'Shared Result Not Found | PRPM',
        description: 'This playground result could not be found.',
      };
    }

    const session = await response.json();
    const userInput = session.conversation?.[0]?.content || 'Testing prompt';
    const assistantResponse = session.conversation?.[1]?.content || 'Processing...';

    // Truncate for meta description (155 chars is optimal for SEO)
    const description = `"${userInput.slice(0, 100)}..." - See the result from ${session.package_name}`;

    // Base URL for OG image
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://prpm.dev';
    const ogImageUrl = `${baseUrl}/api/og/playground?token=${token}`;

    return {
      title: `${session.package_name} Playground Result | PRPM`,
      description,
      openGraph: {
        title: `${session.package_name} - Playground Result`,
        description,
        type: 'website',
        url: `${baseUrl}/playground/shared?token=${token}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Playground result for ${session.package_name}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${session.package_name} - Playground Result`,
        description,
        images: [ogImageUrl],
        creator: '@prpm_dev',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Shared Playground Result | PRPM',
      description: 'See how AI prompts perform in the PRPM Playground',
    };
  }
}

export default function SharedPlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
