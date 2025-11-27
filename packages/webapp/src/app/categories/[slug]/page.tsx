import Link from "next/link";
import { getPackageUrl } from "@/lib/package-url";
import type { CategoryWithChildren, Package } from "@/lib/api";
import {
  Folder,
  Package as PackageIcon,
  Download,
  Star,
  ArrowLeft,
} from "lucide-react";
import { readFile } from "fs/promises";
import { join } from "path";
import { cache } from "react";

// Allow dynamic rendering for params not in generateStaticParams
export const dynamicParams = true;

// Disable fetch caching during build to prevent cache issues
export const fetchCache = "force-no-store";

// SSG data paths
const SSG_DATA_DIR = join(process.cwd(), "public", "seo-data");

// Helper to read SSG categories data
async function getSSGCategories(): Promise<CategoryWithChildren[]> {
  try {
    const fileContent = await readFile(
      join(SSG_DATA_DIR, "categories.json"),
      "utf-8",
    );
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

// Helper to read SSG packages data
async function getSSGPackages(): Promise<Package[]> {
  try {
    const fileContent = await readFile(
      join(SSG_DATA_DIR, "packages.json"),
      "utf-8",
    );
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

// Find a category by slug (including nested children)
function findCategoryBySlug(
  categories: CategoryWithChildren[],
  slug: string,
): CategoryWithChildren | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    if (category.children) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
    }
  }
  return null;
}

// Get all descendant slugs for a category (for filtering packages)
function getDescendantSlugs(category: CategoryWithChildren): string[] {
  const slugs = [category.slug];
  if (category.children) {
    for (const child of category.children) {
      slugs.push(...getDescendantSlugs(child));
    }
  }
  return slugs;
}

// Cached function to get category data from SSG
const getCategoryFromSSG = cache(
  async (slug: string): Promise<CategoryWithChildren | null> => {
    const categories = await getSSGCategories();
    return findCategoryBySlug(categories, slug);
  },
);

// Cached function to get packages for a category from SSG
const getPackagesForCategoryFromSSG = cache(
  async (
    slug: string,
    includeChildren: boolean = true,
  ): Promise<{ packages: Package[]; total: number }> => {
    const categories = await getSSGCategories();
    const category = findCategoryBySlug(categories, slug);

    if (!category) {
      return { packages: [], total: 0 };
    }

    const packages = await getSSGPackages();

    // Get all category slugs to filter by
    const categoryNames = includeChildren
      ? getDescendantSlugs(category)
      : [category.slug];

    // Also match by category name (packages store category name, not slug)
    const categoryNameSet = new Set(categoryNames);

    // Filter packages by category (matching either slug or name)
    const filteredPackages = packages.filter((pkg) => {
      const pkgCategory = (pkg as unknown as { category?: string }).category;
      if (!pkgCategory) return false;
      // Match against slug or the category name
      return (
        categoryNameSet.has(pkgCategory) ||
        categoryNameSet.has(pkgCategory.toLowerCase().replace(/\s+/g, "-"))
      );
    });

    // Sort by downloads (descending)
    filteredPackages.sort(
      (a, b) => (b.total_downloads || 0) - (a.total_downloads || 0),
    );

    // Limit to first 100
    const limitedPackages = filteredPackages.slice(0, 100);

    return {
      packages: limitedPackages,
      total: filteredPackages.length,
    };
  },
);

// Generate static params for all categories from SSG data
export async function generateStaticParams() {
  try {
    // Skip SSG in CI/test builds
    if (process.env.NEXT_PUBLIC_SKIP_SSG === "true") {
      console.log(
        "[SSG Categories] ⚡ NEXT_PUBLIC_SKIP_SSG=true, returning minimal params for fast build",
      );
      // Return one dummy category to satisfy Next.js requirements
      return [{ slug: "test-category" }];
    }

    const categories = await getSSGCategories();

    // Flatten all categories and subcategories to get all slugs
    const slugs: string[] = [];

    function collectSlugs(category: CategoryWithChildren) {
      slugs.push(category.slug);
      if (category.children) {
        category.children.forEach(collectSlugs);
      }
    }

    categories.forEach(collectSlugs);

    console.log(
      `[SSG Categories] ✅ Generating ${slugs.length} category pages from SSG data`,
    );

    // If SSG data is empty, return dummy entry to satisfy Next.js static export
    if (slugs.length === 0) {
      console.log(
        "[SSG Categories] ⚠️  SSG data file is empty, returning minimal params",
      );
      return [{ slug: "test-category" }];
    }

    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("[SSG Categories] ERROR in generateStaticParams:", error);
    // Return dummy entry to satisfy Next.js static export requirements
    return [{ slug: "test-category" }];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    // Use SSG data during static build
    const [category, packagesResult] = await Promise.all([
      getCategoryFromSSG(params.slug),
      getPackagesForCategoryFromSSG(params.slug, true),
    ]);

    if (!category) {
      throw new Error("Category not found");
    }

    const packages = packagesResult.packages;
    const total = packagesResult.total;

    return (
      <main className="min-h-screen bg-prpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/categories"
              className="text-prpm-accent hover:text-prpm-accent-light mb-4 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </Link>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-prpm-accent/10 rounded-lg">
                <Folder className="w-8 h-8 text-prpm-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {category.name}
                </h1>
                {category.package_count !== undefined && (
                  <p className="text-gray-400 mt-1">
                    {category.package_count} packages in this category
                  </p>
                )}
              </div>
            </div>

            {category.description && (
              <p className="text-gray-300 text-lg mt-4">
                {category.description}
              </p>
            )}
          </div>

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Subcategories
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.children.map((subcategory: CategoryWithChildren) => (
                  <Link
                    key={subcategory.id}
                    href={`/categories/${subcategory.slug}`}
                    className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 hover:border-prpm-accent transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-prpm-accent transition-colors">
                          {subcategory.name}
                        </h3>
                        {subcategory.package_count !== undefined && (
                          <p className="text-sm text-gray-400 mt-1">
                            {subcategory.package_count} packages
                          </p>
                        )}
                      </div>
                      <PackageIcon className="w-5 h-5 text-gray-400 group-hover:text-prpm-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Packages */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              {total > 0
                ? `${total} Packages${total > 100 ? " (showing first 100)" : ""}`
                : "Packages"}
            </h2>

            {packages.length === 0 ? (
              <div className="text-center py-20 bg-prpm-dark-card border border-prpm-border rounded-lg">
                <PackageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  No packages found in this category
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg: Package) => (
                  <Link
                    key={pkg.id}
                    href={getPackageUrl(pkg.name, pkg.author_username || "")}
                    className="block bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white hover:text-prpm-accent transition-colors">
                          {pkg.name}
                        </h3>

                        {pkg.description && (
                          <p className="text-gray-400 mt-2 line-clamp-2">
                            {pkg.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span>
                              {pkg.total_downloads?.toLocaleString() || 0}
                            </span>
                          </div>
                          {pkg.quality_score && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              <span>
                                {Number(pkg.quality_score).toFixed(1)}/5
                              </span>
                            </div>
                          )}
                          {pkg.author_username && (
                            <span>by {pkg.author_username}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                          {pkg.format}
                        </span>
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                          {pkg.subtype}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Failed to load category:", error);
    return (
      <main className="min-h-screen bg-prpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Category Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              The category you're looking for doesn't exist
            </p>
            <Link
              href="/categories"
              className="inline-block bg-prpm-accent hover:bg-prpm-accent-light text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse All Categories
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
