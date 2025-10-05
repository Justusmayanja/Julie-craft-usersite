"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useFeaturedProducts } from "@/hooks/use-products"
import type { FrontendProduct } from "@/lib/types/product"

// Fallback featured products in case API fails
const fallbackFeaturedProducts: FrontendProduct[] = [
  {
    id: 1,
    name: "Traditional Wall Hanging - Geometric Pattern",
    price: 45000,
    originalPrice: 55000,
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    category: "wall-hangings",
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
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
    description: "",
    materials: "",
    dimensions: "",
    care: "",
    cultural: "",
    isNew: false,
    onSale: true,
    inStock: true,
  },
]

export function FeaturedProducts() {
  const { dispatch } = useCart()
  const { products: apiFeaturedProducts, loading, error } = useFeaturedProducts(8)

  // Use API data or fallback to hardcoded data
  const featuredProducts = apiFeaturedProducts.length > 0 ? apiFeaturedProducts : fallbackFeaturedProducts

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleAddToCart = (product: FrontendProduct) => {
    if (product.inStock) {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      })
    }
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Featured Products</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Handpicked selection of our finest crafts, showcasing the exceptional skill and creativity of Ugandan
            artisans.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 mb-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square w-full bg-muted" />
                  <div className="p-4">
                    <div className="h-3 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded mb-3 w-3/4" />
                    <div className="h-5 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 mb-12">
            {featuredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs px-2 py-1">
                        New
                      </Badge>
                    )}
                    {product.onSale && (
                      <Badge variant="destructive" className="bg-destructive text-destructive-foreground text-xs px-2 py-1">
                        Sale
                      </Badge>
                    )}
                    {!product.inStock && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground text-xs px-2 py-1">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1 capitalize font-medium">{product.category ? product.category.replace("-", " ") : "General"}</p>
                  <h3 className="font-semibold mb-2 text-balance text-sm leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-primary text-sm">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full text-xs font-medium"
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
        )}

        <div className="text-center">
          <Link href="/products">
            <Button size="default" variant="outline" className="px-6 py-3 text-base font-semibold border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
