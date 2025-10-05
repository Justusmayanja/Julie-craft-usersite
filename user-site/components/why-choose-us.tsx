import { Shield, Heart, Truck, Users } from "lucide-react"

const benefits = [
  {
    icon: Heart,
    title: "Authentic Craftsmanship",
    description:
      "Every piece is handmade by skilled local artisans using traditional techniques passed down through generations.",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "We carefully select each item to ensure the highest quality materials and exceptional craftsmanship.",
  },
  {
    icon: Users,
    title: "Supporting Communities",
    description:
      "Your purchase directly supports local artisan communities and helps preserve traditional craft techniques.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description:
      "Safe and secure delivery across Uganda with careful packaging to protect your precious handmade items.",
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/40 to-muted/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Why Choose Julie Crafts?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            We're committed to bringing you the finest Ugandan crafts while supporting local artisan communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <benefit.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-4 group-hover:text-primary transition-colors duration-300">{benefit.title}</h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
