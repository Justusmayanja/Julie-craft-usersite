import Link from "next/link"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">JC</span>
              </div>
              <span className="font-bold text-xl">Julie Crafts</span>
            </div>
            <p className="text-muted-foreground">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary
              design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/products" className="block text-muted-foreground hover:text-primary transition-colors">
                Products
              </Link>
              <Link href="/services" className="block text-muted-foreground hover:text-primary transition-colors">
                Services
              </Link>
              <Link href="/gallery" className="block text-muted-foreground hover:text-primary transition-colors">
                Gallery
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Categories</h3>
            <div className="space-y-2">
              <Link
                href="/products?category=pottery"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Wood Crafts
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Ntinda View Apartments, Kampala</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+256 700 123 456</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">hello@juliecrafts.ug</span>
              </div>
              <div className="flex space-x-3 pt-2">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Julie Crafts. All rights reserved. Made with ❤️ in Uganda.</p>
        </div>
      </div>
    </footer>
  )
}
