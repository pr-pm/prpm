/**
 * Package Category Constants and Validation
 */

/**
 * Valid package categories
 * Each package can have one primary category
 */
export const VALID_CATEGORIES = [
  // Development & Coding
  'development',
  'development/frontend',
  'development/backend',
  'development/mobile',
  'development/devops',
  'development/testing',
  'development/architecture',

  // Data & Analytics
  'data',
  'data/analysis',
  'data/ml',
  'data/etl',
  'data/sql',
  'data/visualization',

  // Writing & Content
  'writing',
  'writing/documentation',
  'writing/creative',
  'writing/business',
  'writing/marketing',
  'writing/academic',

  // Productivity & Workflow
  'productivity',
  'productivity/automation',
  'productivity/planning',
  'productivity/research',
  'productivity/templates',

  // Education & Learning
  'education',
  'education/tutorial',
  'education/exercise',
  'education/explanation',
  'education/teaching',

  // Design & Creative
  'design',
  'design/ui-ux',
  'design/graphics',
  'design/web',
  'design/branding',

  // Business & Finance
  'business',
  'business/strategy',
  'business/finance',
  'business/sales',
  'business/operations',

  // Security & Privacy
  'security',
  'security/audit',
  'security/compliance',
  'security/pentesting',
  'security/encryption',

  // Tools & Utilities
  'tools',
  'tools/conversion',
  'tools/generation',
  'tools/validation',
  'tools/debugging',

  // General
  'general',
  'general/assistant',
  'general/starter',
  'general/misc',
] as const;

export type PackageCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Category metadata for UI display
 */
export interface CategoryMetadata {
  slug: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: CategoryMetadata[];
}

export const CATEGORY_METADATA: Record<string, CategoryMetadata> = {
  development: {
    slug: 'development',
    name: 'Development & Coding',
    description: 'Software development, coding, and programming assistance',
    icon: 'code',
  },
  data: {
    slug: 'data',
    name: 'Data & Analytics',
    description: 'Data analysis, machine learning, and analytics',
    icon: 'chart',
  },
  writing: {
    slug: 'writing',
    name: 'Writing & Content',
    description: 'Content creation, writing, and documentation',
    icon: 'edit',
  },
  productivity: {
    slug: 'productivity',
    name: 'Productivity & Workflow',
    description: 'Productivity tools, automation, and workflow',
    icon: 'lightning',
  },
  education: {
    slug: 'education',
    name: 'Education & Learning',
    description: 'Learning, teaching, and educational content',
    icon: 'book',
  },
  design: {
    slug: 'design',
    name: 'Design & Creative',
    description: 'Design, creative work, and visual content',
    icon: 'palette',
  },
  business: {
    slug: 'business',
    name: 'Business & Finance',
    description: 'Business operations, finance, and entrepreneurship',
    icon: 'briefcase',
  },
  security: {
    slug: 'security',
    name: 'Security & Privacy',
    description: 'Security, privacy, and compliance',
    icon: 'shield',
  },
  tools: {
    slug: 'tools',
    name: 'Tools & Utilities',
    description: 'General-purpose tools and utilities',
    icon: 'wrench',
  },
  general: {
    slug: 'general',
    name: 'General',
    description: 'General-purpose and miscellaneous packages',
    icon: 'star',
  },
};

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string | null | undefined): category is PackageCategory {
  if (!category) return false;
  return (VALID_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Get primary category from full category path
 * Example: "development/frontend" → "development"
 */
export function getPrimaryCategory(category: string): string {
  if (!category) return 'general';
  return category.split('/')[0];
}

/**
 * Get subcategory from full category path
 * Example: "development/frontend" → "frontend"
 */
export function getSubcategory(category: string): string | null {
  if (!category) return null;
  const parts = category.split('/');
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Get all categories that match a prefix
 * Example: "development" → ["development", "development/frontend", ...]
 */
export function getCategoriesByPrefix(prefix: string): PackageCategory[] {
  return VALID_CATEGORIES.filter((cat) => cat.startsWith(prefix));
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: string): CategoryMetadata | null {
  const primary = getPrimaryCategory(category);
  return CATEGORY_METADATA[primary] || null;
}

/**
 * Suggest category based on keywords/tags
 */
export function suggestCategory(
  keywords: string[] = [],
  tags: string[] = [],
  description: string = ''
): PackageCategory {
  const allText = [...keywords, ...tags, description].join(' ').toLowerCase();

  // Development patterns
  if (
    /react|vue|angular|svelte|frontend|ui|component/.test(allText)
  ) {
    return 'development/frontend';
  }
  if (
    /node|express|fastapi|django|backend|api|server/.test(allText)
  ) {
    return 'development/backend';
  }
  if (
    /ios|android|react native|flutter|mobile/.test(allText)
  ) {
    return 'development/mobile';
  }
  if (
    /docker|kubernetes|ci\/cd|devops|deployment/.test(allText)
  ) {
    return 'development/devops';
  }
  if (
    /test|testing|jest|pytest|qa|debug/.test(allText)
  ) {
    return 'development/testing';
  }
  if (
    /code|coding|programming|development/.test(allText)
  ) {
    return 'development';
  }

  // Data patterns
  if (
    /pandas|numpy|data analysis|analytics/.test(allText)
  ) {
    return 'data/analysis';
  }
  if (
    /machine learning|ml|tensorflow|pytorch|ai model/.test(allText)
  ) {
    return 'data/ml';
  }
  if (
    /sql|query|database|postgres|mysql/.test(allText)
  ) {
    return 'data/sql';
  }
  if (
    /data|dataset|analytics/.test(allText)
  ) {
    return 'data';
  }

  // Writing patterns
  if (
    /documentation|docs|readme|api doc/.test(allText)
  ) {
    return 'writing/documentation';
  }
  if (
    /marketing|copy|ad|social media/.test(allText)
  ) {
    return 'writing/marketing';
  }
  if (
    /business|email|proposal|report/.test(allText)
  ) {
    return 'writing/business';
  }
  if (
    /writing|content|blog|article/.test(allText)
  ) {
    return 'writing';
  }

  // Productivity patterns
  if (
    /automation|workflow|automate/.test(allText)
  ) {
    return 'productivity/automation';
  }
  if (
    /meeting|notes|summary|research/.test(allText)
  ) {
    return 'productivity/research';
  }
  if (
    /productivity|efficient|organize/.test(allText)
  ) {
    return 'productivity';
  }

  // Education patterns
  if (
    /tutorial|guide|learn|teach/.test(allText)
  ) {
    return 'education/tutorial';
  }
  if (
    /education|learning|course/.test(allText)
  ) {
    return 'education';
  }

  // Design patterns
  if (
    /ui|ux|design|interface|prototype/.test(allText)
  ) {
    return 'design/ui-ux';
  }
  if (
    /design|creative|visual/.test(allText)
  ) {
    return 'design';
  }

  // Security patterns
  if (
    /security|secure|audit|vulnerability/.test(allText)
  ) {
    return 'security/audit';
  }
  if (
    /gdpr|compliance|hipaa|privacy/.test(allText)
  ) {
    return 'security/compliance';
  }
  if (
    /security|privacy/.test(allText)
  ) {
    return 'security';
  }

  // Tools patterns
  if (
    /convert|conversion|transform/.test(allText)
  ) {
    return 'tools/conversion';
  }
  if (
    /generate|generator|builder/.test(allText)
  ) {
    return 'tools/generation';
  }
  if (
    /validate|validation|check/.test(allText)
  ) {
    return 'tools/validation';
  }
  if (
    /tool|utility|helper/.test(allText)
  ) {
    return 'tools';
  }

  // Default
  return 'general/misc';
}
