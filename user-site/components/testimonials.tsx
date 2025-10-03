"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Nakamura",
    location: "Kampala",
    rating: 5,
    text: "The pottery I bought from Julie Crafts is absolutely beautiful. You can feel the love and skill that went into making each piece. Highly recommended!",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 2,
    name: "David Okello",
    location: "Entebbe",
    rating: 5,
    text: "Amazing quality and authentic designs. The wooden sculptures I purchased are now the centerpiece of my living room. Excellent customer service too!",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    name: "Grace Atim",
    location: "Jinja",
    rating: 5,
    text: "I love supporting local artisans, and Julie Crafts makes it easy. The jewelry is stunning and the story behind each piece makes it even more special.",
    image: "/placeholder.svg?height=60&width=60",
  },
]

export function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Hear from our satisfied customers who have experienced the beauty of authentic Ugandan crafts.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative h-64 overflow-hidden">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentTestimonial ? "opacity-100" : "opacity-0"
                }`}
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6 text-pretty">"{testimonial.text}"</blockquote>
                  <div className="flex items-center justify-center space-x-3">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTestimonial ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
