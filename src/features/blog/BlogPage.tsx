import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const articles = [
  {
    slug: 'how-to-apply-50-jobs-a-day',
    title: 'How to Apply to 50 Jobs a Day Without Losing Your Mind',
    excerpt:
      'High-volume job applications are not about working harder — they are about working smarter. Learn the systems and tools that make it possible.',
    category: 'Productivity',
    date: 'March 20, 2026',
    readTime: '8 min read',
  },
  {
    slug: 'best-job-application-autofill-tools-2026',
    title: 'The Best Job Application Autofill Tools in 2026',
    excerpt:
      'We tested the most popular autofill tools for job seekers. Here is how they stack up on accuracy, privacy, and platform coverage.',
    category: 'Tools & Reviews',
    date: 'March 18, 2026',
    readTime: '10 min read',
  },
  {
    slug: 'why-you-keep-retyping-same-info',
    title: 'Why You Keep Re-Typing the Same Info (And How to Stop)',
    excerpt:
      'Every ATS is a walled garden. Here is why the job application process is so repetitive — and the simple fix that saves hours per week.',
    category: 'Job Search Tips',
    date: 'March 15, 2026',
    readTime: '7 min read',
  },
]

export function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">JobFlow Blog</h1>
        <p className="text-lg text-gray-600">
          Tips, tools, and strategies for a faster, smarter job search.
        </p>
      </header>

      <div className="space-y-8">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <p className="text-sm text-blue-600 font-medium mb-2">{article.category}</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h2>
            <p className="text-gray-600 mb-4">{article.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{article.date}</span>
                <span>{article.readTime}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                Read more <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
