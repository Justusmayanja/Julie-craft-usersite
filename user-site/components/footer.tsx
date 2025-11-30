"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Facebook, Instagram, Phone, Mail, MapPin, Twitter, Youtube } from "lucide-react"

interface Category {
  id: string
  name: string
  slug?: string | null
  is_active: boolean
}

interface SiteSettings {
  site_name?: string
  site_tagline?: string
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
}

// Default fallback values
const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Julie Crafts',
  site_tagline: 'Authentic handmade crafts from the heart of Uganda, celebrating traditional artistry and contemporary design.',
  contact_address: 'Ntinda View Apartments, Kampala',
  contact_phone: '+256 777796529/+256 57020034',
  contact_email: 'kingsjuliet90@gmail.com',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  youtube_url: ''
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [settingsLoading, setSettingsLoading] = useState(true)

  // Fetch site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/site-content/settings')
        if (response.ok) {
          const data = await response.json()
          const fetchedSettings: SiteSettings = {}
          
          // Extract values from settings object, handling JSONB parsing
          Object.entries(data.settings || {}).forEach(([key, setting]: [string, any]) => {
            let value = setting.value
            
            // If value is a string that looks like JSON, try to parse it
            if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{') || value.startsWith('['))) {
              try {
                value = JSON.parse(value)
              } catch {
                // If parsing fails, use the string as-is
              }
            }
            
            // Only set if value exists and is not empty
            if (value && typeof value === 'string' && value.trim() !== '') {
              fetchedSettings[key as keyof SiteSettings] = value.trim()
            }
          })
          
          // Merge with defaults, only using fetched values if they exist
          setSettings({
            ...DEFAULT_SETTINGS,
            ...fetchedSettings
          })
        }
      } catch (err) {
        console.error('Error fetching site settings for footer:', err)
        // Use defaults on error
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?limit=4')
        if (response.ok) {
          const data = await response.json()
          // Get first 4 active categories
          const activeCategories = (data.categories || [])
            .filter((cat: Category) => cat.is_active)
            .slice(0, 4)
          setCategories(activeCategories)
        }
      } catch (err) {
        console.error('Error fetching categories for footer:', err)
        // Fallback to empty array
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  return (
    <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-t-2 border-slate-700 shadow-2xl overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 w-full">
          {/* Brand - spans full width on mobile, then 2 columns, then 1 column on lg */}
          <div className="col-span-2 lg:col-span-1 space-y-4 sm:space-y-5 min-w-0">
            <Logo 
              variant="full" 
              size="lg" 
              dark={true}
              showTagline={true}
            />
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-sm break-words">
              {settings.site_tagline || DEFAULT_SETTINGS.site_tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5 min-w-0">
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
          <div className="space-y-3 sm:space-y-4 lg:space-y-5 min-w-0">
            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white mb-3 sm:mb-4">Categories</h3>
            <nav className="flex flex-col space-y-2 sm:space-y-3">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const categoryPath = category.slug 
                    ? `/categories/${category.slug}` 
                    : `/categories/${category.id}`
                  return (
                    <Link
                      key={category.id}
                      href={categoryPath}
                      className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium w-fit"
                    >
                      {category.name}
                    </Link>
                  )
                })
              ) : (
                // Fallback loading state or empty state
                <>
                  <div className="text-xs sm:text-sm lg:text-base text-slate-400">Loading...</div>
                </>
              )}
            </nav>
          </div>

          {/* Contact Info - spans full width on mobile, then 2 columns, then 1 column on lg */}
          <div className="col-span-2 lg:col-span-1 space-y-3 sm:space-y-4 lg:space-y-5 min-w-0">
            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white mb-3 sm:mb-4">Contact</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed block break-words overflow-wrap-anywhere">
                    {settings.contact_address || DEFAULT_SETTINGS.contact_address}
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <a 
                    href={`tel:${(settings.contact_phone || DEFAULT_SETTINGS.contact_phone)?.replace(/[^0-9+]/g, '')}`}
                    className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium break-words overflow-wrap-anywhere block"
                  >
                    {settings.contact_phone || DEFAULT_SETTINGS.contact_phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <a 
                    href={`mailto:${settings.contact_email || DEFAULT_SETTINGS.contact_email}`}
                    className="text-xs sm:text-sm lg:text-base text-slate-300 hover:text-amber-400 transition-colors duration-200 font-medium break-all overflow-wrap-anywhere block"
                  >
                    {settings.contact_email || DEFAULT_SETTINGS.contact_email}
                  </a>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-1 sm:pt-2">
                {settings.facebook_url && (
                  <Link 
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                  </Link>
                )}
                {settings.instagram_url && (
                  <Link 
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                  </Link>
                )}
                {settings.twitter_url && (
                  <Link 
                    href={settings.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                  </Link>
                )}
                {settings.youtube_url && (
                  <Link 
                    href={settings.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-slate-700/50 pt-8 mt-8 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">
            <p className="text-center sm:text-left text-sm sm:text-base text-slate-400 font-medium break-words min-w-0 flex-1">
              &copy; {currentYear} {settings.site_name || DEFAULT_SETTINGS.site_name}. All rights reserved.
            </p>
            <p className="text-center sm:text-right text-sm sm:text-base text-slate-400 break-words min-w-0 flex-shrink-0">
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
