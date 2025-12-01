import Link from 'next/link'
import Header from '@/components/Header'
import { Lightbulb } from 'lucide-react'
import { readFile } from 'fs/promises'
import { join } from 'path'
import UseCasesTable from '@/components/UseCasesTable'

interface UseCase {
  id: string
  name: string
  slug: string
  description: string | null
  example_query: string | null
  package_count?: number
}

// Force static export for S3 deployment
export const dynamic = 'force-static'

export default async function UseCasesPage() {
  let useCases: UseCase[] = []

  try {
    const ssgDataPath = join(process.cwd(), 'public', 'seo-data', 'use-cases.json')
    const fileContent = await readFile(ssgDataPath, 'utf-8')
    useCases = JSON.parse(fileContent)
    console.log(`[UseCases Page] ✅ Loaded ${useCases.length} use cases from SSG data`)
  } catch (error) {
    console.error('[UseCases Page] ERROR loading use cases:', error)
    useCases = []
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <div className="max-w-7xl mx-auto py-8 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-4">
            Browse Use Cases
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Find packages organized by what you're trying to accomplish.
          </p>
        </div>

        {useCases.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-prpm-card rounded-full mb-4">
              <Lightbulb className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">No use cases available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Use cases will appear here once the taxonomy is generated.</p>
          </div>
        ) : (
          <UseCasesTable useCases={useCases} />
        )}
      </div>
    </main>
  )
}