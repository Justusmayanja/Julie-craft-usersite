"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Nakimuli",
    role: "Verified Customer",
    content: "Absolutely beautiful products! The quality is exceptional and the craftsmanship is outstanding. I've been a customer for over a year and every purchase exceeds my expectations.",
    rating: 5,
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Verified Customer", 
    content: "I love supporting local artisans through JulieCraft. Every purchase feels meaningful and I know I'm helping preserve traditional Ugandan craftsmanship.",
    rating: 5,
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Verified Customer",
    content: "The attention to detail in these handmade products is incredible. The traditional patterns and natural materials make each piece unique. Highly recommended!",
    rating: 5,
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 4,
    name: "David Ochieng",
    role: "Verified Customer",
    content: "As someone who values authentic African art, JulieCraft delivers exactly what I was looking for. The quality and authenticity are unmatched.",
    rating: 5,
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 5,
    name: "Grace Mwangi",
    role: "Verified Customer",
    content: "The customer service is excellent and the products arrive beautifully packaged. I've gifted several items and everyone loves them!",
    rating: 5,
    avatar: "/placeholder-user.jpg"
  }
]

export function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(timer)
  }, [])

  const goToPrevious = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const goToTestimonial = (index: number) => {
    setCurrentTestimonial(index)
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        
        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    {/* Stars */}
                    <div className="flex justify-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    {/* Content */}
                    <blockquote className="text-lg text-gray-700 mb-6 italic">
                      "{testimonial.content}"
                    </blockquote>
                    
                    {/* Author */}
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 overflow-hidden">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? "bg-primary scale-110" 
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}