interface TagProps {
  children: React.ReactNode
}

export default function Tag({ children }: TagProps) {
  return (
    <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
      {children}
    </span>
  )
}
