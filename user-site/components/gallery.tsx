"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

const galleryImages = [
  {
    id: 1,
    src: "/ugandan-pottery-artisan-working-clay-warm-lighting.jpg",
    alt: "Ugandan pottery artisan working with clay",
    category: "pottery",
    title: "Master Potter at Work",
    description: "Skilled artisan shaping clay using traditional techniques passed down through generations.",
  },
  {
    id: 2,
    src: "/colorful-african-beaded-jewelry-display-vibrant.jpg",
    alt: "Colorful African beaded jewelry display",
    category: "jewelry",
    title: "Vibrant Beaded Collection",
    description: "Stunning array of handcrafted beaded jewelry showcasing traditional African colors and patterns.",
  },
  {
    id: 3,
    src: "/traditional-ugandan-textiles-weaving-colorful-patt.jpg",
    alt: "Traditional Ugandan textiles with colorful patterns",
    category: "textiles",
    title: "Traditional Textile Weaving",
    description: "Intricate weaving process creating beautiful textiles with cultural significance.",
  },
  {
    id: 4,
    src: "/wooden-african-sculptures-carvings-craftsmanship.jpg",
    alt: "Wooden African sculptures and carvings",
    category: "wood",
    title: "Masterful Wood Carvings",
    description: "Exquisite wooden sculptures demonstrating exceptional craftsmanship and artistic vision.",
  },
  {
    id: 5,
    src: "/african-home-decor-baskets-natural-materials.jpg",
    alt: "African home decor baskets made from natural materials",
    category: "home-decor",
    title: "Natural Home Decor",
    description: "Beautiful baskets and home decor items crafted from sustainable natural materials.",
  },
  {
    id: 6,
    src: "/artisan-crafting-custom-piece-workshop.jpg",
    alt: "Artisan crafting custom piece in workshop",
    category: "workshop",
    title: "Custom Craft Creation",
    description: "Artisan working on a custom piece in the traditional workshop setting.",
  },
  {
    id: 7,
    src: "/traditional-clay-water-pot-ugandan-pottery.jpg",
    alt: "Traditional clay water pot",
    category: "pottery",
    title: "Traditional Water Vessel",
    description: "Classic clay water pot showcasing traditional Ugandan pottery techniques.",
  },
  {
    id: 8,
    src: "/colorful-maasai-beaded-necklace-traditional.jpg",
    alt: "Colorful Maasai beaded necklace",
    category: "jewelry",
    title: "Maasai Beadwork",
    description: "Traditional Maasai-inspired beaded necklace with cultural color significance.",
  },
  {
    id: 9,
    src: "/kente-cloth-traditional-african-textile-colorful.jpg",
    alt: "Kente cloth traditional African textile",
    category: "textiles",
    title: "Authentic Kente Cloth",
    description: "Handwoven Kente cloth featuring traditional patterns and vibrant colors.",
  },
  {
    id: 10,
    src: "/wooden-elephant-sculpture-african-carving.jpg",
    alt: "Wooden elephant sculpture",
    category: "wood",
    title: "Elephant Wood Carving",
    description: "Beautifully carved wooden elephant representing strength and wisdom.",
  },
  {
    id: 11,
    src: "/ceramic-pottery-bowls-traditional-african.jpg",
    alt: "Ceramic pottery bowls",
    category: "pottery",
    title: "Ceramic Bowl Collection",
    description: "Set of handcrafted ceramic bowls with traditional African patterns.",
  },
  {
    id: 12,
    src: "/african-baskets-home-decor-natural-materials.jpg",
    alt: "African baskets for home decor",
    category: "home-decor",
    title: "Woven Basket Collection",
    description: "Variety of handwoven baskets perfect for storage and decoration.",
  },
]

const categories = [
  { value: "all", label: "All" },
  { value: "pottery", label: "Pottery" },
  { value: "jewelry", label: "Jewelry" },
  { value: "textiles", label: "Textiles" },
  { value: "wood", label: "Wood Crafts" },
  { value: "home-decor", label: "Home Decor" },
  { value: "workshop", label: "Workshop" },
]

export function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const filteredImages = galleryImages.filter(
    (image) => selectedCategory === "all" || image.category === selectedCategory,
  )

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return

    const currentIndex = filteredImages.findIndex((img) => img.id === selectedImage)
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedImage(filteredImages[newIndex].id)
  }

  const currentImage = selectedImage ? galleryImages.find((img) => img.id === selectedImage) : null

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Craft Gallery</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Explore our visual showcase of authentic Ugandan crafts, featuring artisans at work and finished
            masterpieces that celebrate traditional techniques and contemporary design.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className="capitalize"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => openLightbox(image.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="capitalize">
                      {image.category.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white font-semibold text-sm mb-1">{image.title}</h3>
                    <p className="text-white/80 text-xs line-clamp-2">{image.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No images found in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && currentImage && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateImage("prev")}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateImage("next")}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={currentImage.src || "/placeholder.svg"}
                  alt={currentImage.alt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <div className="max-w-2xl">
                  <Badge variant="secondary" className="mb-2 capitalize">
                    {currentImage.category.replace("-", " ")}
                  </Badge>
                  <h2 className="text-xl font-bold mb-2">{currentImage.title}</h2>
                  <p className="text-white/80">{currentImage.description}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
