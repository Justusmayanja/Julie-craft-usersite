"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-t border-amber-200/60 shadow-sm">
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 shadow-lg">
                <Image 
                  src="/julie-logo.jpeg" 
                  alt="JulieCraft Logo" 
                  fill
                  sizes="48px"
                  className="object-contain p-2"
                  priority
                  onError={(e) => {
                    // Fallback to a simple icon if image fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-amber-900">Julie Crafts</span>
                <span className="text-sm text-amber-700 -mt-1">Authentic Handmade</span>
              </div>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary
              design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl text-amber-900">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/about" className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium">
                About Us
              </Link>
              <Link href="/products" className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium">
                Products
              </Link>
              <Link href="/contact" className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium">
                Contact
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl text-amber-900">Categories</h3>
            <div className="space-y-3">
              <Link
                href="/products?category=pottery"
                className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="block text-amber-800 hover:text-primary transition-colors duration-300 font-medium"
              >
                Wood Crafts
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl text-amber-900">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-amber-800">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Ntinda View Apartments, Kampala</span>
              </div>
              <div className="flex items-center space-x-3 text-amber-800">
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">+256 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3 text-amber-800">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">hello@juliecrafts.ug</span>
              </div>
              <div className="flex space-x-4 pt-3">
                <Link href="#" className="text-amber-800 hover:text-primary transition-all duration-300 hover:scale-110">
                  <Facebook className="h-6 w-6" />
                </Link>
                <Link href="#" className="text-amber-800 hover:text-primary transition-all duration-300 hover:scale-110">
                  <Instagram className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-200/60 mt-8 pt-6 text-center text-amber-800">
          <p className="text-lg font-medium">&copy; {currentYear} Julie Crafts. All rights reserved. Made with ❤️ in Uganda.</p>
        </div>
      </div>
    </footer>
  )
}
