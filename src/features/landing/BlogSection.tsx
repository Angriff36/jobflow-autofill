import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const articles = [
  {
    slug: 'how-to-apply-50-jobs-a-day',
    title: 'How to Apply to 50 Jobs a Day Without Losing Your Mind',
    excerpt:
      'High-volume job applications are not about working harder — they are about working smarter. Learn the systems and tools that make it possible.',
    category: 'Productivity',
  },
  {
    slug: 'best-job-application-autofill-tools-2026',
    title: 'The Best Job Application Autofill Tools in 2026',
    excerpt:
      'We tested the most popular autofill tools for job seekers. Here is how they stack up on accuracy, privacy, and platform coverage.',
    category: 'Tools & Reviews',
  },
  {
    slug: 'why-you-keep-retyping-same-info',
    title: 'Why You Keep Re-Typing the Same Info (And How to Stop)',
    excerpt:
      'Every ATS is a walled garden. Here is why the job application process is so repetitive — and the simple fix that saves hours per week.',
    category: 'Job Search Tips',
  },
]

export function BlogSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">From the Blog</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Strategies and insights to help you land your next role faster.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col"
            >
              <p className="text-sm text-blue-600 font-medium mb-2">{article.category}</p>
              <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">{article.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                Read more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
