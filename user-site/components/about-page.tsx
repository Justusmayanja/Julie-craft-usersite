import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Users, Award, Leaf, Globe, Handshake } from "lucide-react"
import Link from "next/link"

export function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Authentic Craftsmanship",
      description:
        "Every piece is handmade using traditional techniques passed down through generations of skilled Ugandan artisans.",
    },
    {
      icon: Users,
      title: "Community Support",
      description:
        "We work directly with local artisan communities, ensuring fair wages and supporting traditional craft preservation.",
    },
    {
      icon: Leaf,
      title: "Sustainable Materials",
      description:
        "We use only sustainable, locally-sourced materials that respect both the environment and cultural traditions.",
    },
    {
      icon: Globe,
      title: "Cultural Heritage",
      description:
        "Each craft tells a story of Uganda's rich cultural heritage, connecting you to centuries of artistic tradition.",
    },
  ]

  const achievements = [
    { number: "500+", label: "Artisans Supported" },
    { number: "50+", label: "Communities Reached" },
    { number: "10,000+", label: "Happy Customers" },
    { number: "15+", label: "Years of Experience" },
  ]

  const process = [
    {
      step: "1",
      title: "Artisan Partnership",
      description: "We partner with skilled local artisans who have mastered traditional techniques.",
    },
    {
      step: "2",
      title: "Quality Selection",
      description: "Each piece is carefully selected for quality, authenticity, and cultural significance.",
    },
    {
      step: "3",
      title: "Fair Trade",
      description: "We ensure fair compensation and sustainable working conditions for all our partners.",
    },
    {
      step: "4",
      title: "Global Delivery",
      description: "We bring these beautiful crafts to customers who appreciate authentic artistry.",
    },
  ]

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Celebrating Uganda's Rich Craft Heritage</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Julie Crafts was born from a passion for preserving traditional Ugandan artistry while supporting local
            communities. We bridge the gap between skilled artisans and craft enthusiasts worldwide.
          </p>
        </div>

        {/* Founder Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Meet Juliet Nnyonyozi</h2>
            <p className="text-muted-foreground text-pretty">
              Growing up in Kampala, I was surrounded by the incredible artistry of Ugandan craftspeople. My grandmother
              was a skilled weaver, and watching her work sparked my lifelong appreciation for traditional crafts.
            </p>
            <p className="text-muted-foreground text-pretty">
              After studying business and traveling the world, I realized how unique and valuable our local crafts are.
              In 2009, I founded Julie Crafts to create a sustainable platform that celebrates our artisans while
              sharing their beautiful work with the world.
            </p>
            <p className="text-muted-foreground text-pretty">
              Today, we work with over 500 artisans across Uganda, ensuring they receive fair compensation while
              preserving traditional techniques for future generations. Every purchase supports not just an artisan, but
              an entire community.
            </p>
            <Link href="/contact">
              <Button>Get Started</Button>
            </Link>
          </div>
          <div className="relative">
            <img
              src="/young-african-woman-weaving-traditional-mat.jpg"
              alt="Juliet Nnyonyozi, Founder of Julie Crafts, weaving a traditional mat"
              className="w-full h-[500px] object-cover rounded-lg shadow-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold">Juliet Nnyonyozi</p>
              <p className="text-sm text-muted-foreground">Founder & CEO, Julie Crafts</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              These core values guide everything we do, from selecting artisan partners to delivering your order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-primary/5 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Over the years, we've built a thriving ecosystem that benefits artisans, communities, and customers alike.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{achievement.number}</div>
                <p className="text-muted-foreground font-medium">{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Work</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our process ensures quality, authenticity, and fair trade practices at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((step, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold text-lg mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{step.description}</p>
                </CardContent>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary/30 transform -translate-y-1/2" />
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Awards & Recognition */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recognition & Awards</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              We're honored to be recognized for our commitment to artisan communities and cultural preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Uganda Export Award</h3>
                <p className="text-muted-foreground text-sm">Best Cultural Export Business 2023</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Handshake className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Fair Trade Certified</h3>
                <p className="text-muted-foreground text-sm">Certified fair trade practices since 2018</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Community Impact Award</h3>
                <p className="text-muted-foreground text-sm">Outstanding community development 2022</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-muted/30 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto text-pretty">
            Every purchase supports Ugandan artisans and helps preserve traditional crafts for future generations.
            Discover authentic pieces that tell a story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">Browse Our Crafts</Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline">
                Learn About Our Services
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
