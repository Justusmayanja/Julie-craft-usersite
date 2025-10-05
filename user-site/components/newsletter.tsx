"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    setIsSubscribed(true)
    setEmail("")
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  return (
    <section className="py-16 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
      <div className="container mx-auto px-6 lg:px-8">
        <Card className="max-w-4xl mx-auto bg-card/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Stay Connected</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
              Subscribe to our newsletter to receive updates on new products, artisan stories, and exclusive offers.
            </p>

            {isSubscribed ? (
              <div className="text-primary font-semibold text-lg bg-primary/10 px-6 py-4 rounded-xl">
                Thank you for subscribing! Check your email for confirmation.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 text-lg border-2 focus:border-primary"
                />
                <Button type="submit" className="sm:w-auto h-12 px-8 text-lg font-semibold">
                  Subscribe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
