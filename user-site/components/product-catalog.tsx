"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/contexts/toast-context"
import { Search, Grid, List, Loader2 } from "lucide-react"
import { ProductModal } from "@/components/product-modal"
import { useCart } from "@/contexts/cart-context"
import { useProducts, useCategories } from "@/hooks/use-products"
import type { FrontendProduct } from "@/lib/types/product"

// Fallback products in case API fails
const fallbackProducts: FrontendProduct[] = [
  {
    id: 1,
    name: "Traditional Wall Hanging - Geometric Pattern",
    price: 45000,
    originalPrice: 55000,
    image: "/traditional-wall-hanging-african-textile-patterns.jpg",
    category: "wall-hangings",
    description:
      "Beautiful handwoven wall hanging featuring traditional geometric patterns. Made using authentic techniques passed down through generations. Perfect for adding cultural elegance to any room.",
    materials: "Natural cotton, traditional dyes",
    dimensions: "Height: 80cm, Width: 60cm",
    care: "Gentle hand wash, air dry",
    cultural: "Geometric patterns represent unity and harmony in African culture",
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
    description:
      "Vibrant handmade Maasai-inspired necklace featuring traditional color patterns. Each bead is carefully selected and strung by skilled artisans. A statement piece that celebrates African heritage.",
    materials: "Glass beads, cotton thread, metal clasp",
    dimensions: "Length: 45cm, adjustable",
    care: "Avoid water, store in dry place",
    cultural: "Colors represent different meanings in Maasai culture",
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
    description:
      "Durable handwoven door mat made from natural fibers. Features traditional patterns and provides excellent durability for high-traffic areas. Eco-friendly and sustainable.",
    materials: "Natural grass, palm fibers",
    dimensions: "Length: 60cm, Width: 40cm",
    care: "Shake out dirt, spot clean as needed",
    cultural: "Traditional weaving techniques from rural Uganda",
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
    description:
      "Masterfully carved elephant sculpture from sustainable hardwood. Represents strength, wisdom, and good fortune. Each piece is unique with natural wood grain patterns.",
    materials: "Sustainable hardwood, natural finish",
    dimensions: "Height: 20cm, Length: 25cm",
    care: "Dust with soft cloth, occasional wood polish",
    cultural: "Elephants symbolize wisdom and strength in African culture",
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
    description:
      "Large traditional sitting room mat featuring authentic African patterns. Handwoven using natural materials for comfort and durability. Perfect for creating a cultural focal point in your living space.",
    materials: "Natural grass, traditional dyes",
    dimensions: "Length: 180cm, Width: 120cm",
    care: "Vacuum regularly, spot clean with mild soap",
    cultural: "Patterns represent prosperity and family unity",
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
    description:
      "Set of three handcrafted beaded bracelets with complementary colors. Each bracelet tells a story through its unique pattern and color combination.",
    materials: "Glass beads, elastic cord",
    dimensions: "Adjustable fit, 16-20cm",
    care: "Avoid water, store separately",
    cultural: "Each color combination has traditional significance",
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
    description:
      "Stunning wall hanging featuring sunset-inspired colors and patterns. Handwoven with natural dyes that capture the beauty of African sunsets.",
    materials: "100% cotton, natural dyes",
    dimensions: "Height: 90cm, Width: 70cm",
    care: "Gentle hand wash, air dry away from direct sunlight",
    cultural: "Sunset patterns represent the end of a successful day",
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
    description:
      "Hand-carved wooden salad bowl from sustainable local wood. Natural finish highlights the beautiful grain. Perfect for serving salads, fruits, or as decorative piece.",
    materials: "Sustainable local hardwood, food-safe finish",
    dimensions: "Diameter: 28cm, Height: 8cm",
    care: "Hand wash, oil occasionally with food-safe oil",
    cultural: "Carved using traditional woodworking techniques",
    isNew: false,
    onSale: true,
    inStock: true,
  },
]

// Fallback categories in case API fails
const fallbackCategories = [
  { value: "all", label: "All Categories" },
  { value: "wall-hangings", label: "Wall Hangings" },
  { value: "door-mats", label: "Door Mats" },
  { value: "traditional-mats", label: "Traditional Mats" },
  { value: "jewelry", label: "Jewelry" },
  { value: "wood", label: "Wood Crafts" },
]

const sortOptions = [
  { value: "name", label: "Name A-Z" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
]

export function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProduct, setSelectedProduct] = useState<FrontendProduct | null>(null)

  // Check if we should use API or fallback data
  const [useApiData, setUseApiData] = useState(true)

  // Fetch products and categories
  const { products: apiProducts, loading: productsLoading, error: productsError, total } = useProducts({
    search: searchTerm || undefined,
    category_id: selectedCategory !== "all" ? selectedCategory : undefined,
    sort_by: sortBy === "name" ? "name" : sortBy === "price-low" ? "price" : sortBy === "price-high" ? "price" : "created_at",
    sort_order: sortBy === "price-high" ? "desc" : "asc",
  })

  const { categories: apiCategories, loading: categoriesLoading, error: categoriesError } = useCategories()

  // Determine if we should use API data or fallback
  useEffect(() => {
    // If API returns empty products and we have an error, or if API is not configured, use fallback
    if ((apiProducts.length === 0 && productsError) || (apiProducts.length === 0 && !productsLoading)) {
      setUseApiData(false)
    } else if (apiProducts.length > 0) {
      setUseApiData(true)
    }
  }, [apiProducts.length, productsError, productsLoading])

  // Use API data or fallback to hardcoded data
  const products = useApiData && apiProducts.length > 0 ? apiProducts : fallbackProducts
  const categories = useApiData && apiCategories.length > 0 
    ? [
        { value: "all", label: "All Categories" },
        ...apiCategories.map(cat => ({
          value: cat.name.toLowerCase().replace(/\s+/g, '-'),
          label: cat.name
        }))
      ]
    : fallbackCategories

  const loading = productsLoading || categoriesLoading

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (useApiData && apiProducts.length > 0) {
      // API data is already filtered and sorted - filter out out-of-stock products
      return apiProducts.filter((product) => product.inStock !== false)
    }

    // Fallback filtering for hardcoded data - filter out out-of-stock products
    const filtered = fallbackProducts.filter((product) => {
      // Only show in-stock products
      if (!product.inStock) return false
      
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.materials.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          return b.isNew ? 1 : -1
        default:
          return 0
      }
    })

    return filtered
  }, [useApiData, apiProducts, searchTerm, selectedCategory, sortBy])

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const { addItem } = useCart()
  const toast = useToast()

  const handleAddToCart = async (product: FrontendProduct, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!product.inStock) {
      toast.showError("Out of Stock", "This product is currently unavailable.")
      return
    }

    try {
      const success = await addItem({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        inStock: product.inStock,
      })

      if (success) {
        toast.showSuccess("Added to Cart!", `${product.name} has been added to your cart.`)
      } else {
        toast.showError("Unable to Add", "This item is currently out of stock or unavailable.")
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.showError("Error", "Failed to add item to cart. Please try again.")
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover our complete collection of authentic Ugandan crafts, each piece carefully selected for quality and
            cultural significance.
          </p>
          {!useApiData && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Showing sample products. Database connection not available - using cached data.
              </p>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products, materials, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading products...
              </div>
            ) : (
              <>
                Showing {filteredAndSortedProducts.length} of {useApiData ? (total || products.length) : fallbackProducts.length} products
                {searchTerm && ` for "${searchTerm}"`}
                {!useApiData && (
                  <span className="text-blue-600 ml-2">
                    (Using cached data due to connection issues)
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square w-full bg-muted rounded-t-lg" />
                  <div className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded mb-4 w-3/4" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6" : "space-y-4"
            }
          >
            {filteredAndSortedProducts.map((product) => (
            <Card
              key={product.id}
              className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                viewMode === "list" ? "flex flex-row" : ""
              }`}
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className={`p-0 ${viewMode === "list" ? "flex flex-row w-full" : "h-full flex flex-col"}`}>
                <div
                  className={`relative overflow-hidden bg-gray-100 ${
                    viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "aspect-square w-full rounded-t-lg"
                  } ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg"}`}
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                      target.onerror = null
                    }}
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
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
                <div className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : "flex-1 flex flex-col justify-between"}`}>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 capitalize">
                      {product.category ? product.category.replace("-", " ") : "General"}
                    </p>
                    <h3 className="font-semibold mb-2 text-balance">{product.name}</h3>
                    {viewMode === "list" && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button size="sm" disabled={!product.inStock} onClick={(e) => handleAddToCart(product, e)}>
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-2">No products found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  )
}
