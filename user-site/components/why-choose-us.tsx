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
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Why Choose Julie Crafts?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            We're committed to bringing you the finest Ugandan crafts while supporting local artisan communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-pretty">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
