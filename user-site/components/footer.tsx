"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-t-2 border-slate-700 shadow-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8">
          {/* Brand - spans full width on mobile, then 2 columns, then 1 column on lg */}
          <div className="col-span-2 lg:col-span-1 space-y-4 sm:space-y-5">
            <Logo 
              variant="full" 
              size="lg" 
              dark={true}
              showTagline={true}
            />
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-sm">
              Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white mb-3 sm:mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2 sm:space-y-3">
              <Link 
                href="/about" 
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                About Us
              </Link>
              <Link 
                href="/products" 
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Products
              </Link>
              <Link 
                href="/contact" 
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white mb-3 sm:mb-4">Categories</h3>
            <nav className="flex flex-col space-y-2 sm:space-y-3">
              <Link
                href="/products?category=pottery"
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Pottery
              </Link>
              <Link
                href="/products?category=jewelry"
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Jewelry
              </Link>
              <Link
                href="/products?category=textiles"
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Textiles
              </Link>
              <Link
                href="/products?category=wood"
                className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
              >
                Wood Crafts
              </Link>
            </nav>
          </div>

          {/* Contact Info - spans full width on mobile, then 2 columns, then 1 column on lg */}
          <div className="col-span-2 lg:col-span-1 space-y-3 sm:space-y-4 lg:space-y-5">
            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white mb-3 sm:mb-4">Contact</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed block">
                    Ntinda View Apartments, Kampala
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <a 
                  href="tel:+256700123456" 
                  className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium break-words"
                >
                  +256 777796529/+256 57020034
                </a>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <a 
                  href="mailto:hello@juliecrafts.ug" 
                  className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium break-all"
                >
                  kingsjuliet90@gmail.com
                </a>
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-1 sm:pt-2">
                <Link 
                  href="#" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                </Link>
                <Link 
                  href="#" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
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
