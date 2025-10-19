"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

const slides = [
  {
    id: 1,
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    title: "Traditional Wall Hangings",
    subtitle: "Handcrafted Heritage",
    description:
      "Beautiful handwoven wall hangings featuring authentic African patterns that bring cultural elegance to any space.",
    cta: "Shop Wall Hangings",
    ctaLink: "/products?category=wall-hangings",
  },
  {
    id: 2,
    image: "/colorful-african-beaded-jewelry-display-vibrant.jpg",
    title: "Vibrant Beaded Jewelry",
    subtitle: "Colors of Africa",
    description:
      "Stunning handmade jewelry featuring traditional African beadwork and contemporary designs that tell a story.",
    cta: "Explore Jewelry",
    ctaLink: "/products?category=jewelry",
  },
  {
    id: 3,
    image: "/traditional-door-mats-woven-natural-materials.jpg",
    title: "Handwoven Door Mats",
    subtitle: "Welcome with Style",
    description: "Durable and beautiful door mats crafted from natural materials using traditional weaving techniques.",
    cta: "View Door Mats",
    ctaLink: "/products?category=door-mats",
  },
  {
    id: 4,
    image: "/wooden-african-sculptures-carvings-craftsmanship.jpg",
    title: "Masterful Wood Carvings",
    subtitle: "Carved Perfection",
    description:
      "Exquisite wooden sculptures and functional pieces that showcase the incredible skill of Ugandan woodworkers.",
    cta: "See Wood Crafts",
    ctaLink: "/products?category=wood",
  },
  {
    id: 5,
    image: "/sitting-room-traditional-mats-african-patterns.jpg",
    title: "Traditional Sitting Room Mats",
    subtitle: "Comfort & Culture",
    description:
      "Transform your living space with authentic traditional mats featuring intricate patterns and natural materials.",
    cta: "Shop Traditional Mats",
    ctaLink: "/products?category=traditional-mats",
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Changed to 5 seconds for better viewing

    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  return (
    <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative"
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-gradient-to-br from-blue-600 to-purple-600"
              style={{ 
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex items-center justify-center">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-2xl text-white text-center mx-auto">
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-secondary mb-2 tracking-wide">{slide.subtitle}</p>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance leading-tight">{slide.title}</h1>
                    <p className="text-lg md:text-xl mb-6 text-pretty opacity-95 leading-relaxed max-w-xl mx-auto">{slide.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <Link href={slide.ctaLink}>
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                        {slide.cta}
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/40 px-6 py-4 text-base font-semibold backdrop-blur-sm hover:backdrop-blur-md transition-all duration-300"
                      >
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 transition-all duration-300 hover:scale-110 shadow-lg z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 transition-all duration-300 hover:scale-110 shadow-lg z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? "bg-white shadow-lg scale-110" 
                : "bg-white/50 hover:bg-white/70 hover:scale-105"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
