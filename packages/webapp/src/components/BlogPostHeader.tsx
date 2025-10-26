import Tag from './Tag'

interface BlogPostHeaderProps {
  tags: string[]
  title: string
  author: string
  date: string
  readTime: string
}

export default function BlogPostHeader({ tags, title, author, date, readTime }: BlogPostHeaderProps) {
  return (
    <header className="mb-12">
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
        {title}
      </h1>

      <div className="flex items-center gap-4 text-gray-400 text-sm">
        <span>By {author}</span>
        <span>•</span>
        <span>{date}</span>
        <span>•</span>
        <span>{readTime}</span>
      </div>
    </header>
  )
}
