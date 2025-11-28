"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Users, 
  Award, 
  Leaf, 
  Globe, 
  Handshake,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Palette
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"

export function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Authentic Craftsmanship",
      description:
        "Every piece is handmade using traditional techniques passed down through generations of skilled Ugandan artisans.",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50 dark:bg-red-950/20"
    },
    {
      icon: Users,
      title: "Community Support",
      description:
        "We work directly with local artisan communities, ensuring fair wages and supporting traditional craft preservation.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Leaf,
      title: "Sustainable Materials",
      description:
        "We use only sustainable, locally-sourced materials that respect both the environment and cultural traditions.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: Globe,
      title: "Cultural Heritage",
      description:
        "Each craft tells a story of Uganda's rich cultural heritage, connecting you to centuries of artistic tradition.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
  ]

  const achievements = [
    { number: "500+", label: "Artisans Supported", icon: Users },
    { number: "50+", label: "Communities Reached", icon: Globe },
    { number: "10,000+", label: "Happy Customers", icon: Heart },
    { number: "15+", label: "Years of Experience", icon: Award },
  ]

  const process = [
    {
      step: "1",
      title: "Artisan Partnership",
      description: "We partner with skilled local artisans who have mastered traditional techniques.",
      icon: Handshake
    },
    {
      step: "2",
      title: "Quality Selection",
      description: "Each piece is carefully selected for quality, authenticity, and cultural significance.",
      icon: Shield
    },
    {
      step: "3",
      title: "Fair Trade",
      description: "We ensure fair compensation and sustainable working conditions for all our partners.",
      icon: CheckCircle2
    },
    {
      step: "4",
      title: "Global Delivery",
      description: "We bring these beautiful crafts to customers who appreciate authentic artistry.",
      icon: TrendingUp
    },
  ]

  const awards = [
    {
      icon: Award,
      title: "Uganda Export Award",
      subtitle: "Best Cultural Export Business 2023",
      description: "Recognized for excellence in promoting Ugandan culture globally"
    },
    {
      icon: Handshake,
      title: "Fair Trade Certified",
      subtitle: "Certified since 2018",
      description: "Committed to ethical trading practices and fair compensation"
    },
    {
      icon: Users,
      title: "Community Impact Award",
      subtitle: "Outstanding Development 2022",
      description: "Honored for significant positive impact on artisan communities"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              Our Story
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Celebrating Uganda's Rich
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Craft Heritage
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Julie Crafts was born from a passion for preserving traditional Ugandan artistry while supporting local
              communities. We bridge the gap between skilled artisans and craft enthusiasts worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/products">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Explore Our Crafts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-slate-50" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Founder Story */}
        <section className="mb-20 sm:mb-24 lg:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block">
                <Badge variant="outline" className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
                  Meet the Founder
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Meet Juliet Nnyonyozi
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p className="text-base sm:text-lg">
                  Growing up in Kampala, I was surrounded by the incredible artistry of Ugandan craftspeople. My grandmother
                  was a skilled weaver, and watching her work sparked my lifelong appreciation for traditional crafts.
                </p>
                <p className="text-base sm:text-lg">
                  After studying business and traveling the world, I realized how unique and valuable our local crafts are.
                  In 2009, I founded Julie Crafts to create a sustainable platform that celebrates our artisans while
                  sharing their beautiful work with the world.
                </p>
                <p className="text-base sm:text-lg">
                  Today, we work with over 500 artisans across Uganda, ensuring they receive fair compensation while
                  preserving traditional techniques for future generations. Every purchase supports not just an artisan, but
                  an entire community.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/contact">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                    Connect With Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl"></div>
                <Image
                  src="/young-african-woman-weaving-traditional-mat.jpg"
                  alt="Juliet Nnyonyozi, Founder of Julie Crafts, weaving a traditional mat"
                  width={600}
                  height={700}
                  className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover relative z-10"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 z-20">
                  <p className="font-bold text-xl text-white mb-1">Juliet Nnyonyozi</p>
                  <p className="text-sm text-amber-300">Founder & CEO, Julie Crafts</p>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20 sm:mb-24 lg:mb-32">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
              What We Stand For
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              These core values guide everything we do, from selecting artisan partners to delivering your order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, index) => (
              <Card 
                key={index} 
                className="group border-2 hover:border-amber-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden"
              >
                <CardContent className="p-6 sm:p-8 text-center relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${value.color} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <value.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl sm:text-2xl mb-3 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-20 sm:mb-24 lg:mb-32">
          <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 bg-white/80 text-amber-700 border-amber-200">
                  Our Impact
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                  Making a Difference
                </h2>
                <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
                  Over the years, we've built a thriving ecosystem that benefits artisans, communities, and customers alike.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
                      <achievement.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2">
                      {achievement.number}
                    </div>
                    <p className="text-slate-700 font-semibold text-sm sm:text-base">{achievement.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="mb-20 sm:mb-24 lg:mb-32">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
              Our Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              How We Work
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our process ensures quality, authenticity, and fair trade practices at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
            {/* Connection line for desktop */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"></div>
            
            {process.map((step, index) => (
              <Card 
                key={index} 
                className="relative border-2 hover:border-amber-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group"
              >
                <CardContent className="p-6 sm:p-8 text-center relative z-10 bg-white">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {step.step}
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 mb-4 group-hover:bg-amber-100 transition-colors">
                    <step.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-3 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{step.description}</p>
                </CardContent>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 w-8 h-8 bg-white border-2 border-amber-300 rounded-full z-20 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Awards & Recognition */}
        <section className="mb-20 sm:mb-24 lg:mb-32">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
              Recognition
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Awards & Recognition
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We're honored to be recognized for our commitment to artisan communities and cultural preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {awards.map((award, index) => (
              <Card 
                key={index} 
                className="border-2 hover:border-amber-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group overflow-hidden"
              >
                <CardContent className="p-6 sm:p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <award.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-slate-900">{award.title}</h3>
                    <p className="text-amber-600 font-semibold mb-3">{award.subtitle}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{award.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <div className="inline-block mb-4">
                <Logo variant="text-only" size="lg" dark={true} showTagline={true} />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Join Our Mission
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                Every purchase supports Ugandan artisans and helps preserve traditional crafts for future generations.
                Discover authentic pieces that tell a story.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/products">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                    Browse Our Crafts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
