'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface UseCase {
  id: string
  name: string
  slug: string
  description: string | null
  example_query: string | null
  package_count?: number
}

interface UseCasesTableProps {
  useCases: UseCase[]
}

export default function UseCasesTable({ useCases }: UseCasesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUseCases = useCases.filter(uc => 
    uc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Filter use cases..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-prpm-dark-card border border-prpm-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-prpm-accent transition-colors placeholder-gray-500"
        />
      </div>

      <div className="bg-prpm-dark-card border border-prpm-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-prpm-dark border-b border-prpm-border text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Use Case Name</th>
                <th className="px-6 py-4 font-semibold text-right">Packages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-prpm-border/50">
              {filteredUseCases.length > 0 ? (
                filteredUseCases.map((uc) => (
                  <tr key={uc.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/search?useCase=${uc.slug}`}>
                    <td className="px-6 py-4 font-medium text-white group-hover:text-prpm-accent transition-colors">
                      <Link href={`/search?useCase=${uc.slug}`} className="block" onClick={(e) => e.stopPropagation()}>
                        {uc.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-right">
                      {uc.package_count || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No use cases found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-right text-xs text-gray-500">
        Showing {filteredUseCases.length} of {useCases.length} use cases
      </div>
    </div>
  )
}
