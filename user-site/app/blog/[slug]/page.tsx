"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowLeft, Newspaper, Eye, Heart, MessageCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image: string | null
  publish_date: string | null
  author_name: string
  category: string
  views: number
  likes: number
  comments_count: number
  created_at: string
  updated_at: string
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/blog/slug/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Blog post not found')
          } else {
            setError('Failed to load blog post')
          }
          return
        }

        const data = await response.json()
        setPost(data.post)
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError('Failed to load blog post')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-64 md:h-96 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/blog">
              <Button variant="outline">View All Posts</Button>
            </Link>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const readingTime = Math.ceil((post.content.replace(/<[^>]*>/g, '').split(' ').length || 0) / 200)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Featured Image */}
          {post.featured_image && !imageError ? (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8 bg-gray-200">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                onError={() => setImageError(true)}
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Newspaper className="w-20 h-20 text-gray-400" />
            </div>
          )}

          {/* Article Content */}
          <article className="bg-white rounded-lg shadow-lg p-6 md:p-10">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg md:text-xl text-gray-600 mb-6 italic">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-gray-600 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <User className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span>{post.author_name || 'Admin'}</span>
              </div>
              {post.publish_date && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span>
                    {new Date(post.publish_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span>{readingTime} min read</span>
              </div>
              {post.views > 0 && (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span>{post.views} views</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Engagement Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {post.views > 0 && (
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    <span>{post.views} views</span>
                  </div>
                )}
                {post.likes > 0 && (
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    <span>{post.likes} likes</span>
                  </div>
                )}
                {post.comments_count > 0 && (
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span>{post.comments_count} comments</span>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Link href="/blog">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Posts
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

