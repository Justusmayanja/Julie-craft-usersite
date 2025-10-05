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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Hear from our satisfied customers who have experienced the beauty of authentic Ugandan crafts.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative h-80 overflow-hidden rounded-2xl">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className={`absolute inset-0 transition-opacity duration-1000 bg-card/90 backdrop-blur-sm border-0 shadow-xl ${
                  index === currentTestimonial ? "opacity-100" : "opacity-0"
                }`}
              >
                <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400 mx-1" />
                    ))}
                  </div>
                  <blockquote className="text-xl md:text-2xl mb-8 text-pretty leading-relaxed italic text-muted-foreground">"{testimonial.text}"</blockquote>
                  <div className="flex items-center justify-center space-x-4">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                    />
                    <div className="text-left">
                      <p className="font-bold text-lg">{testimonial.name}</p>
                      <p className="text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? "bg-primary scale-125 shadow-lg" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
