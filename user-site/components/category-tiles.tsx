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
    href: "/services",
    description: "Made to order",
  },
]

export function CategoryTiles() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Explore Our Craft Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover authentic Ugandan crafts across various categories, each piece telling a unique story of tradition
            and artistry.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-center mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">{category.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
