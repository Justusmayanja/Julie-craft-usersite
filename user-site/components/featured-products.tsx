"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"

const featuredProducts = [
  {
    id: 1,
    name: "Traditional Wall Hanging - Geometric Pattern",
    price: 45000,
    originalPrice: 55000,
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    category: "wall-hangings",
    isNew: false,
    onSale: true,
    inStock: true,
  },
  {
    id: 2,
    name: "Beaded Maasai Necklace",
    price: 25000,
    image: "/colorful-maasai-beaded-necklace-traditional.jpg",
    category: "jewelry",
    isNew: true,
    onSale: false,
    inStock: true,
  },
  {
    id: 3,
    name: "Woven Door Mat - Natural Fibers",
    price: 35000,
    image: "/traditional-door-mats-woven-natural-materials.jpg",
    category: "door-mats",
    isNew: false,
    onSale: false,
    inStock: true,
  },
  {
    id: 4,
    name: "Carved Elephant Sculpture",
    price: 85000,
    originalPrice: 100000,
    image: "/wooden-elephant-sculpture-african-carving.jpg",
    category: "wood",
    isNew: false,
    onSale: true,
    inStock: true,
  },
  {
    id: 5,
    name: "Traditional Sitting Room Mat - Large",
    price: 75000,
    image: "/sitting-room-traditional-mats-african-patterns.jpg",
    category: "traditional-mats",
    isNew: true,
    onSale: false,
    inStock: true,
  },
  {
    id: 6,
    name: "Beaded Bracelet Set",
    price: 18000,
    image: "/colorful-african-beaded-jewelry-display-vibrant.jpg",
    category: "jewelry",
    isNew: false,
    onSale: false,
    inStock: true,
  },
  {
    id: 7,
    name: "Wall Hanging - Sunset Pattern",
    price: 52000,
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    category: "wall-hangings",
    isNew: true,
    onSale: false,
    inStock: false,
  },
  {
    id: 8,
    name: "Wooden Salad Bowl",
    price: 30000,
    originalPrice: 38000,
    image: "/wooden-african-sculptures-carvings.jpg",
    category: "wood",
    isNew: false,
    onSale: true,
    inStock: true,
  },
]

export function FeaturedProducts() {
  const { addItem } = useCart()

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      inStock: product.inStock,
    })
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Featured Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Handpicked selection of our finest crafts, showcasing the exceptional skill and creativity of Ugandan
            artisans.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                        New
                      </Badge>
                    )}
                    {product.onSale && (
                      <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
                        Sale
                      </Badge>
                    )}
                    {!product.inStock && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1 capitalize">{product.category.replace("-", " ")}</p>
                  <h3 className="font-semibold mb-2 text-balance">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/products">
            <Button size="lg" variant="outline">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
