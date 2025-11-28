"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, ArrowRight, Newspaper } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  publish_date: string | null
  author_name: string
  category: string
  views: number
}

/**
 * Rotating Spotlight Blog Carousel
 * 
 * Features:
 * - Center spotlight card (1.2x larger, full opacity)
 * - Side cards (0.85 scale, reduced opacity, blurred)
 * - Auto-rotation every 5 seconds
 * - Smooth fade + slide + zoom-in animations
 * - Navigation arrows
 * - Pause on hover
 * - Responsive (mobile: single card with swipe)
 * - Keyboard navigation (left/right arrows)
 */
export function BlogCarousel() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useIsMobile()

  // Auto-rotation interval: 5 seconds (between 4-6 seconds as requested)
  const AUTO_ROTATE_INTERVAL = 5000
  const minSwipeDistance = 50

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog?status=published&featured=true&limit=5&sort_by=publish_date&sort_order=desc')
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data = await response.json()
        
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts)
        } else {
          // Fallback to any published posts
          const fallbackResponse = await fetch('/api/blog?status=published&limit=5&sort_by=publish_date&sort_order=desc')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.posts && fallbackData.posts.length > 0) {
              setPosts(fallbackData.posts)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlogPosts()
  }, [])

  // Auto-rotation with pause on hover
  useEffect(() => {
    if (posts.length <= 1 || isPaused) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
        autoPlayTimerRef.current = null
      }
      return
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length)
    }, AUTO_ROTATE_INTERVAL)

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
        autoPlayTimerRef.current = null
      }
    }
  }, [posts.length, isPaused])

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if carousel is in focus or user is not typing
      if (carouselRef.current?.contains(document.activeElement) || 
          document.activeElement?.tagName === 'BODY') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setCurrentIndex((prev) => (prev + 1) % posts.length)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [posts.length])

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1))
  }, [posts.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length)
  }, [posts.length])

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  const handleImageError = (postId: string) => {
    setImageErrors((prev) => new Set(prev).add(postId))
  }

  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false
    return url.startsWith('http') || (url.startsWith('/') && !url.includes('blog/'))
  }

  // Get visible posts (center + left + right)
  const getVisiblePosts = (): Array<{ post: BlogPost; position: 'left' | 'center' | 'right' }> => {
    if (posts.length === 0) return []
    if (posts.length === 1) {
      return [{ post: posts[0], position: 'center' }]
    }
    
    const visible: Array<{ post: BlogPost; position: 'left' | 'center' | 'right' }> = []
    
    // Left card (previous)
    const leftIndex = currentIndex === 0 ? posts.length - 1 : currentIndex - 1
    visible.push({ post: posts[leftIndex], position: 'left' })
    
    // Center card (active)
    visible.push({ post: posts[currentIndex], position: 'center' })
    
    // Right card (next)
    const rightIndex = (currentIndex + 1) % posts.length
    visible.push({ post: posts[rightIndex], position: 'right' })
    
    return visible
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
            Latest News & Stories
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="animate-pulse">
                <div className="h-64 md:h-80 bg-gray-200 rounded-xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!loading && posts.length === 0) {
    return (
      <div className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
            Latest News & Stories
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <Newspaper className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                No blog posts yet
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Check back soon for our latest stories, craft tutorials, and news!
              </p>
              <Link href="/products">
                <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium">
                  Browse Our Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const visiblePosts = getVisiblePosts()

  return (
    <div className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
          Latest News & Stories
        </h2>
        
        {/* Rotating Spotlight Carousel */}
        <div 
          ref={carouselRef}
          className="relative w-full max-w-7xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          role="region"
          aria-label="Blog posts carousel"
          aria-live="polite"
          tabIndex={0}
        >
          {/* Carousel Container */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
            {/* Cards Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {isMobile ? (
                // Mobile: Single card view
                <div className="absolute inset-0 flex items-center justify-center">
                  {visiblePosts
                    .filter(({ position }) => position === 'center')
                    .map(({ post }) => (
                      <div
                        key={post.id}
                        className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
                        style={{
                          opacity: 1,
                          transform: 'scale(1) translateX(0)',
                          zIndex: 20
                        }}
                      >
                        <BlogCard post={post} isActive={true} imageErrors={imageErrors} onImageError={handleImageError} isValidImageUrl={isValidImageUrl} />
                      </div>
                    ))}
                </div>
              ) : (
                // Desktop: Three cards (left, center, right)
                visiblePosts.map(({ post, position }) => {
                  const isActive = position === 'center'
                  
                  // Calculate styles based on position
                  let scale = 0.85 // Side cards scale
                  let opacity = 0.5 // Side cards opacity
                  let blur = '8px' // Side cards blur
                  let translateX = 0
                  let zIndex = 10
                  
                  if (isActive) {
                    scale = 1.2 // Center card is 1.2x larger
                    opacity = 1.0 // Full opacity
                    blur = '0px' // No blur
                    translateX = 0
                    zIndex = 30
                  } else if (position === 'left') {
                    translateX = -42 // Move left (accounting for scale difference)
                    zIndex = 20
                  } else if (position === 'right') {
                    translateX = 42 // Move right (accounting for scale difference)
                    zIndex = 20
                  }
                  
                  return (
                    <div
                      key={`${post.id}-${position}`}
                      className="absolute transition-all duration-700 ease-out"
                      style={{
                        transform: `translateX(${translateX}%) scale(${scale})`,
                        opacity,
                        filter: `blur(${blur})`,
                        zIndex,
                        transformOrigin: 'center center',
                        pointerEvents: isActive ? 'auto' : 'none'
                      }}
                    >
                      <BlogCard 
                        post={post} 
                        isActive={isActive} 
                        imageErrors={imageErrors} 
                        onImageError={handleImageError} 
                        isValidImageUrl={isValidImageUrl}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {posts.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 lg:-left-16 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40 backdrop-blur-sm"
                aria-label="Previous post"
                type="button"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 lg:-right-16 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40 backdrop-blur-sm"
                aria-label="Next post"
                type="button"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
              </button>
            </>
          )}
        </div>

        {/* View All Link */}
        {posts.length > 0 && (
          <div className="text-center mt-8 md:mt-12">
            <Link href="/blog">
              <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-base transition-colors group">
                View All Blog Posts
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        )}

        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {currentIndex + 1} of {posts.length}
        </div>
      </div>
    </div>
  )
}

/**
 * Blog Card Component
 * Displays individual blog post card with image, category, title, excerpt, and read more link
 */
interface BlogCardProps {
  post: BlogPost
  isActive: boolean
  imageErrors: Set<string>
  onImageError: (postId: string) => void
  isValidImageUrl: (url: string | null) => boolean
}

function BlogCard({ post, isActive, imageErrors, onImageError, isValidImageUrl }: BlogCardProps) {
  return (
    <div className="w-[280px] md:w-[320px] lg:w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-700">
      {/* Blog Image */}
      <div className="relative h-48 md:h-56 lg:h-64 bg-gray-200">
        {post.featured_image && 
         isValidImageUrl(post.featured_image) && 
         !imageErrors.has(post.id) ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 380px"
            onError={() => onImageError(post.id)}
            unoptimized
            priority={isActive}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <Newspaper className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-4 md:p-5 lg:p-6">
        {/* Category Badge */}
        <div className="mb-3 md:mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
            {post.category}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2">
          {post.title}
        </h3>
        
        {/* Excerpt */}
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-5 line-clamp-2">
          {post.excerpt || 'Read more about this story...'}
        </p>
        
        {/* Read More Link */}
        <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-base group/readmore transition-colors">
          Read More
          <ArrowRight className="w-4 h-4 ml-2 group-hover/readmore:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
