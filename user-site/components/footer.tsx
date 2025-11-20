"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 border-t border-stone-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/50 shadow-md">
                <Image 
                  src="/julie-logo.jpeg" 
                  alt="JulieCraft Logo" 
                  fill
                  sizes="(max-width: 640px) 48px, 56px"
                  className="object-contain p-2"
                  priority
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl sm:text-2xl text-stone-800">Julie Crafts</span>
                <span className="text-xs sm:text-sm text-stone-600 -mt-1">Authentic Handmade</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-sm">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="font-bold text-lg sm:text-xl text-stone-800">Quick Links</h3>
            <div className="space-y-2.5 sm:space-y-3">
              <Link 
                href="/about" 
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                About Us
              </Link>
              <Link 
                href="/products" 
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Products
              </Link>
              <Link 
                href="/contact" 
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="font-bold text-lg sm:text-xl text-stone-800">Categories</h3>
            <div className="space-y-2.5 sm:space-y-3">
              <Link
                href="/products?category=pottery"
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="block text-sm sm:text-base text-stone-700 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                Wood Crafts
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="font-bold text-lg sm:text-xl text-stone-800">Contact</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start sm:items-center space-x-3 text-stone-700">
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
                <span className="text-sm sm:text-base font-medium leading-relaxed">
                  Ntinda View Apartments, Kampala
                </span>
              </div>
              <div className="flex items-center space-x-3 text-stone-700">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
                <a 
                  href="tel:+256700123456" 
                  className="text-sm sm:text-base font-medium hover:text-orange-600 transition-colors duration-200"
                >
                  +256 700 123 456
                </a>
              </div>
              <div className="flex items-center space-x-3 text-stone-700">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
                <a 
                  href="mailto:hello@juliecrafts.ug" 
                  className="text-sm sm:text-base font-medium hover:text-orange-600 transition-colors duration-200 break-all"
                >
                  hello@juliecrafts.ug
                </a>
              </div>
              <div className="flex space-x-3 sm:space-x-4 pt-2 sm:pt-3">
                <Link 
                  href="#" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-100 hover:bg-orange-100 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 group-hover:text-orange-600 transition-colors duration-200" />
                </Link>
                <Link 
                  href="#" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-100 hover:bg-orange-100 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 group-hover:text-orange-600 transition-colors duration-200" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-stone-200/60 mt-8 sm:mt-10 pt-6 sm:pt-8">
          <p className="text-center text-sm sm:text-base text-stone-600 font-medium">
            &copy; {currentYear} Julie Crafts. All rights reserved. Made with{' '}
            <span className="text-red-500 inline-block animate-pulse">❤️</span>{' '}
            in Uganda.
          </p>
        </div>
      </div>
    </footer>
  )
}
