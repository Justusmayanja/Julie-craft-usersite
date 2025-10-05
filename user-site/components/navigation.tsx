"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { Menu, ShoppingCart, Search, MessageCircle, User, LogOut } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useClientOnly } from "@/hooks/use-client-only"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const isClient = useClientOnly()
  const { state } = useCart()
  const { user, isAuthenticated, logout } = useAuth()

  // Load profile image from localStorage
  useEffect(() => {
    if (user?.id && isClient) {
      const savedImage = localStorage.getItem(`profile_image_${user.id}`)
      if (savedImage) {
        setProfileImage(savedImage)
      }
    }
  }, [user?.id, isClient])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
  ]

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">JC</span>
              </div>
              <span className="font-bold text-xl text-foreground">Julie Crafts</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 text-slate-700 hover:text-primary transition-all duration-200 font-medium rounded-lg hover:bg-slate-50 group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden sm:flex h-9 w-9 hover:bg-slate-100 transition-colors"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleChatToggle} 
                className="hidden sm:flex h-9 w-9 hover:bg-slate-100 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>

              <Link href="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9 hover:bg-slate-100 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isClient && state.itemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs text-white bg-red-500 border-0"
                    >
                      {state.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-9 w-9 hover:bg-slate-100 transition-colors"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={isClient ? profileImage || undefined : undefined} alt={user?.name || 'Profile'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=orders">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center space-x-3">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 px-4 font-medium hover:bg-slate-100 transition-colors"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button 
                      size="sm" 
                      className="h-9 px-4 font-medium bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden relative p-2 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="w-5 h-0.5 bg-slate-600 transition-all duration-200"></div>
                      <div className="w-5 h-0.5 bg-slate-600 transition-all duration-200"></div>
                      <div className="w-5 h-0.5 bg-slate-600 transition-all duration-200"></div>
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0 bg-white border-l border-slate-200">
                  <VisuallyHidden>
                    <h2>Navigation Menu</h2>
                  </VisuallyHidden>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-sm">JC</span>
                        </div>
                        <span className="font-bold text-lg text-slate-900">Julie Crafts</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8 hover:bg-slate-200"
                      >
                        <span className="sr-only">Close menu</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>

                    {/* Navigation Content */}
                    <div className="flex-1 overflow-y-auto">
                      <nav className="p-6 space-y-6">
                        {/* Main Navigation */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Navigation
                          </h3>
                          {navItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center px-3 py-2.5 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-all duration-200 group"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="font-medium text-base">{item.name}</span>
                              <svg 
                                className="ml-auto h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Quick Actions
                          </h3>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start px-3 py-2.5 h-auto text-slate-700 hover:text-primary hover:bg-slate-50"
                          >
                            <Search className="mr-3 h-4 w-4" />
                            <span className="font-medium">Search Products</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start px-3 py-2.5 h-auto text-slate-700 hover:text-primary hover:bg-slate-50"
                            onClick={handleChatToggle}
                          >
                            <MessageCircle className="mr-3 h-4 w-4" />
                            <span className="font-medium">Chat Support</span>
                          </Button>
                        </div>
                        
                        {/* Authentication Section */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Account
                          </h3>
                          {isAuthenticated ? (
                            <div className="space-y-3">
                              {/* User Info */}
                              <div className="px-3 py-2.5 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={isClient ? profileImage || undefined : undefined} alt={user?.name || 'Profile'} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                  </div>
                                </div>
                              </div>

                              {/* User Actions */}
                              <Link href="/profile" onClick={() => setIsOpen(false)}>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start px-3 py-2.5 h-auto text-slate-700 hover:text-primary hover:bg-slate-50"
                                >
                                  <User className="mr-3 h-4 w-4" />
                                  <span className="font-medium">My Profile</span>
                                </Button>
                              </Link>
                              <Link href="/profile?tab=orders" onClick={() => setIsOpen(false)}>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start px-3 py-2.5 h-auto text-slate-700 hover:text-primary hover:bg-slate-50"
                                >
                                  <ShoppingBag className="mr-3 h-4 w-4" />
                                  <span className="font-medium">My Orders</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start px-3 py-2.5 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  logout()
                                  setIsOpen(false)
                                }}
                              >
                                <LogOut className="mr-3 h-4 w-4" />
                                <span className="font-medium">Sign Out</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Link href="/login" onClick={() => setIsOpen(false)}>
                                <Button 
                                  variant="outline" 
                                  className="w-full h-11 border-slate-300 hover:bg-slate-50 font-medium"
                                >
                                  Sign In
                                </Button>
                              </Link>
                              <Link href="/register" onClick={() => setIsOpen(false)}>
                                <Button 
                                  className="w-full h-11 bg-primary hover:bg-primary/90 font-medium shadow-sm"
                                >
                                  Create Account
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </nav>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                      <p className="text-xs text-slate-500 text-center">
                        © 2024 Julie's Crafts. All rights reserved.
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {isChatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-card border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Chat with us</h3>
            <Button variant="ghost" size="sm" onClick={handleChatToggle}>
              ×
            </Button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">Hello! How can we help you today?</p>
              </div>
              <div className="bg-primary text-primary-foreground p-3 rounded-lg ml-8">
                <p className="text-sm">Hi, I'm interested in your products!</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  Great! You can browse our products or contact us at 0753445091 for immediate assistance.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button size="sm">Send</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
