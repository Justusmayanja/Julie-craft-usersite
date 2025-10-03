import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Palette,
  Users,
  GraduationCap,
  Package,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Hammer,
  Heart,
} from "lucide-react"
import Link from "next/link"

export function ServicesPage() {
  const services = [
    {
      icon: Palette,
      title: "Custom Craft Orders",
      description: "Personalized pieces designed to your specifications",
      features: [
        "Bespoke wall hangings and textiles",
        "Custom jewelry designs",
        "Personalized home decor",
        "Corporate gifts and awards",
        "Wedding and event pieces",
      ],
      pricing: "Starting from UGX 50,000",
      timeline: "2-4 weeks",
      popular: true,
    },
    {
      icon: GraduationCap,
      title: "Craft Workshops",
      description: "Learn traditional techniques from master artisans",
      features: [
        "Weaving and textile classes",
        "Beadwork and jewelry making",
        "Basket weaving workshops",
        "Wood carving sessions",
        "Group and private lessons",
      ],
      pricing: "UGX 75,000 per person",
      timeline: "Half-day or full-day",
      popular: false,
    },
    {
      icon: Users,
      title: "Corporate Services",
      description: "Bulk orders and team building experiences",
      features: [
        "Wholesale pricing available",
        "Corporate team building",
        "Office decoration packages",
        "Employee gift programs",
        "Cultural experience days",
      ],
      pricing: "Custom quotes available",
      timeline: "1-6 weeks",
      popular: false,
    },
    {
      icon: Package,
      title: "Interior Design Consultation",
      description: "Expert advice on incorporating African crafts",
      features: [
        "Home styling consultation",
        "Craft selection guidance",
        "Color and theme coordination",
        "Space planning advice",
        "Ongoing design support",
      ],
      pricing: "UGX 150,000 per consultation",
      timeline: "1-2 hours",
      popular: false,
    },
  ]

  const workshopTypes = [
    {
      title: "Weaving & Textiles",
      description: "Learn to create beautiful wall hangings and traditional mats using time-honored techniques.",
      duration: "4 hours",
      level: "Beginner to Advanced",
      image: "/young-african-woman-weaving-traditional-mat.jpg",
    },
    {
      title: "Beadwork & Jewelry",
      description: "Create beautiful jewelry using traditional African beading patterns.",
      duration: "3 hours",
      level: "All levels",
      image: "/colorful-african-beaded-jewelry-display-vibrant.jpg",
    },
    {
      title: "Basket Weaving",
      description: "Master the art of weaving using natural materials and traditional patterns.",
      duration: "5 hours",
      level: "Beginner to Intermediate",
      image: "/african-baskets-home-decor-natural-materials.jpg",
    },
    {
      title: "Wood Carving",
      description: "Learn basic carving techniques to create functional and decorative pieces.",
      duration: "6 hours",
      level: "Intermediate to Advanced",
      image: "/wooden-african-sculptures-carvings-craftsmanship.jpg",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Interior Designer",
      content:
        "Julie Crafts helped us source authentic pieces for our hotel project. Their custom service was exceptional, and the quality exceeded our expectations.",
      rating: 5,
    },
    {
      name: "David Okello",
      role: "Workshop Participant",
      content:
        "The weaving workshop was incredible! I learned so much about traditional techniques and created pieces I'm truly proud of. Highly recommended!",
      rating: 5,
    },
    {
      name: "Grace Atim",
      role: "Corporate Client",
      content:
        "We ordered custom gifts for our team, and Julie Crafts delivered beautiful, unique pieces that perfectly represented our company values.",
      rating: 5,
    },
  ]

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Our Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Beyond Beautiful Crafts</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            We offer more than just products. From custom orders to hands-on workshops, we help you connect with
            Uganda's rich craft heritage in meaningful ways.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className={`relative ${service.popular ? "border-primary shadow-lg" : ""}`}>
              {service.popular && (
                <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">Most Popular</Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What's Included:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-primary">{service.pricing}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {service.timeline}
                    </p>
                  </div>
                  <Link href="/contact">
                    <Button>
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workshop Details */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Workshop Experiences</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Immerse yourself in traditional Ugandan craft techniques with our hands-on workshops led by master
              artisans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {workshopTypes.map((workshop, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={workshop.image || "/placeholder.svg"}
                    alt={workshop.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-2">{workshop.title}</h3>
                  <p className="text-muted-foreground mb-4 text-pretty">{workshop.description}</p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {workshop.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {workshop.level}
                    </span>
                  </div>
                  <Button className="w-full">Book Workshop</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="bg-muted/30 rounded-2xl p-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our streamlined process ensures you get exactly what you need, whether it's a custom piece or a workshop
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Consultation",
                description: "Discuss your needs and preferences with our team",
              },
              {
                step: "2",
                title: "Design & Quote",
                description: "Receive detailed proposal and pricing",
              },
              {
                step: "3",
                title: "Creation",
                description: "Our artisans bring your vision to life",
              },
              {
                step: "4",
                title: "Delivery",
                description: "Receive your finished piece or attend your workshop",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold text-lg mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Hear from customers who have experienced our services firsthand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-4 text-pretty">"{testimonial.content}"</blockquote>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-primary/5 rounded-2xl p-8">
          <Hammer className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto text-pretty">
            Whether you need a custom piece, want to learn a new skill, or are planning a corporate event, we're here to
            help bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg">
                <Heart className="h-5 w-5 mr-2" />
                Start Your Project
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                Browse Our Crafts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
