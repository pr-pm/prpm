import React from 'react';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

interface UseCase {
  slug: string;
  name: string;
}

interface UseCaseDisplayProps {
  useCases: UseCase[];
  selectedUseCase: string;
  onSelect: (slug: string) => void;
}

export function UseCaseDisplay({ useCases, selectedUseCase, onSelect }: UseCaseDisplayProps) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Link
        href="/use-cases"
        title="View all use cases"
        className="group flex-shrink-0 w-7 h-7 rounded-md bg-prpm-accent/10 flex items-center justify-center text-prpm-accent hover:bg-prpm-accent hover:text-white transition-all cursor-pointer"
      >
        <Lightbulb className="w-3.5 h-3.5" />
      </Link>

      <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-hide">
        {useCases.map(uc => (
          <button
            key={uc.slug}
            onClick={() => onSelect(uc.slug)}
            title={uc.name}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-all whitespace-nowrap ${
              selectedUseCase === uc.slug
                ? 'bg-prpm-accent text-white border-prpm-accent'
                : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {uc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
