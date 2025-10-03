"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Minus, Plus, ShoppingCart, Heart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  description: string
  materials: string
  dimensions: string
  care: string
  cultural: string
  isNew: boolean
  onSale: boolean
  inStock: boolean
}

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { addItem } = useCart()

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        inStock: product.inStock,
      })
    }
    onClose()
  }

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
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
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2 capitalize">{product.category.replace("-", " ")}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-balance">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.onSale && product.originalPrice && (
                  <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-pretty">{product.description}</p>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            {product.inStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAddToCart} className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={isWishlisted ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            )}

            {!product.inStock && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">This item is currently out of stock.</p>
                <Button variant="outline" disabled>
                  Notify When Available
                </Button>
              </div>
            )}

            <Separator />

            {/* Product Information Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="care">Care</TabsTrigger>
                <TabsTrigger value="cultural">Cultural</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Materials</h4>
                  <p className="text-sm text-muted-foreground">{product.materials}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">{product.dimensions}</p>
                </div>
              </TabsContent>
              <TabsContent value="care" className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Care Instructions</h4>
                  <p className="text-sm text-muted-foreground">{product.care}</p>
                </div>
              </TabsContent>
              <TabsContent value="cultural" className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Cultural Significance</h4>
                  <p className="text-sm text-muted-foreground">{product.cultural}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
