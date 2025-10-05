import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  {
    name: "Wall Hangings",
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    href: "/products?category=wall-hangings",
    description: "Handwoven heritage",
  },
  {
    name: "Jewelry",
    image: "/african-beaded-jewelry-colorful-necklaces.jpg",
    href: "/products?category=jewelry",
    description: "Beaded masterpieces",
  },
  {
    name: "Door Mats",
    image: "/traditional-door-mats-woven-natural-materials.jpg",
    href: "/products?category=door-mats",
    description: "Welcome with style",
  },
  {
    name: "Traditional Mats",
    image: "/sitting-room-traditional-mats-african-patterns.jpg",
    href: "/products?category=traditional-mats",
    description: "Comfort & culture",
  },
  {
    name: "Wood Crafts",
    image: "/wooden-african-sculptures-carvings.jpg",
    href: "/products?category=wood",
    description: "Carved excellence",
  },
  {
    name: "Custom Orders",
    image: "/artisan-crafting-custom-piece-workshop.jpg",
    href: "/contact",
    description: "Made to order",
  },
]

export function CategoryTiles() {
  return (
    <section className="py-16 bg-gradient-to-br from-muted/10 via-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-2xl mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Explore Our Craft Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Discover authentic Ugandan crafts across various categories, each piece telling a unique story of tradition
            and artistry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 lg:gap-10">
          {categories.map((category, index) => (
            <Link key={category.name} href={category.href}>
              <Card className="group hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 bg-card/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden relative">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                
                <CardContent className="p-8 relative z-20">
                  <div className="aspect-square mb-6 overflow-hidden rounded-2xl relative">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Category number */}
                    <div className="absolute top-3 right-3 w-8 h-8 bg-primary/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors duration-300 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {category.description}
                    </p>
                    
                    {/* Hover indicator */}
                    <div className="inline-flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explore</span>
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Bottom section with call-to-action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 bg-primary/5 backdrop-blur-sm rounded-2xl px-8 py-6 border border-primary/10">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-foreground">Can't find what you're looking for?</p>
              <p className="text-sm text-muted-foreground">We offer custom orders tailored to your needs</p>
            </div>
            <Link href="/contact" className="ml-4">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg hover:shadow-xl">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
