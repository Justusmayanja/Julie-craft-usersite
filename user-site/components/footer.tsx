"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-t-2 border-slate-700 shadow-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-lg">
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
                <span className="font-bold text-xl sm:text-2xl text-white">Julie Crafts</span>
                <span className="text-xs sm:text-sm text-slate-300 -mt-1">Authentic Handmade</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-sm">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="font-bold text-lg sm:text-xl text-white mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/about" 
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                About Us
              </Link>
              <Link 
                href="/products" 
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Products
              </Link>
              <Link 
                href="/contact" 
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-5">
            <h3 className="font-bold text-lg sm:text-xl text-white mb-4">Categories</h3>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/products?category=pottery"
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Wood Crafts
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-5">
            <h3 className="font-bold text-lg sm:text-xl text-white mb-4">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-sm sm:text-base text-slate-300 leading-relaxed block">
                    Ntinda View Apartments, Kampala
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
                <a 
                  href="tel:+256700123456" 
                  className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium"
                >
                  +256 777796529/+256 57020034
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
                <a 
                  href="mailto:hello@juliecrafts.ug" 
                  className="text-sm sm:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium break-all"
                >
                  kingsjuliet90@gmail.com
                </a>
              </div>
              <div className="flex space-x-3 pt-2">
                <Link 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                </Link>
                <Link 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-slate-700/50 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-center sm:text-left text-sm sm:text-base text-slate-400 font-medium">
              &copy; {currentYear} Julie Crafts. All rights reserved.
            </p>
            <p className="text-center sm:text-right text-sm sm:text-base text-slate-400">
              Made with{' '}
              <span className="text-red-500 inline-block animate-pulse">❤️</span>{' '}
              in Uganda
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
