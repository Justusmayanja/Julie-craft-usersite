import Link from "next/link"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-muted/30 to-muted/50 border-t">
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">JC</span>
              </div>
              <span className="font-bold text-2xl">Julie Crafts</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary
              design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium">
                About Us
              </Link>
              <Link href="/products" className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium">
                Products
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium">
                Contact
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Categories</h3>
            <div className="space-y-3">
              <Link
                href="/products?category=pottery"
                className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="block text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                Wood Crafts
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Ntinda View Apartments, Kampala</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">+256 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">hello@juliecrafts.ug</span>
              </div>
              <div className="flex space-x-4 pt-3">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                  <Facebook className="h-6 w-6" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110">
                  <Instagram className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6 text-center text-muted-foreground">
          <p className="text-lg font-medium">&copy; 2024 Julie Crafts. All rights reserved. Made with ❤️ in Uganda.</p>
        </div>
      </div>
    </footer>
  )
}
