"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"
import { Menu, ShoppingCart, Search, User, LogOut, ShoppingBag, MessageCircle } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useClientOnly } from "@/hooks/use-client-only"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChatUnreadCount } from "@/hooks/use-chat-unread-count"
import { ChatWidget } from "@/components/chat/chat-widget"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/logo"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const isClient = useClientOnly()
  const { state } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount: chatUnreadCount } = useChatUnreadCount()

  // Load profile image from user data or localStorage
  useEffect(() => {
    if (user && isClient) {
      console.log('Navigation: User object:', user)
      console.log('Navigation: User avatar_url:', user.avatar_url)
      
      // First check if user has an avatar_url from the database
      if (user.avatar_url) {
        console.log('Navigation: Setting profile image from database:', user.avatar_url)
        setProfileImage(user.avatar_url)
      } else if (user.id) {
        // Fallback to localStorage for backward compatibility
        const savedImage = localStorage.getItem(`profile_image_${user.id}`)
        if (savedImage) {
          console.log('Navigation: Setting profile image from localStorage:', savedImage)
          setProfileImage(savedImage)
        }
      }
    }
  }, [user, isClient])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
  ]


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <Logo 
                variant="compact" 
                size="md" 
                dark={true}
                className="group-hover:scale-105 transition-transform duration-300"
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base md:text-xl text-white group-hover:text-amber-400 transition-colors duration-300 leading-tight whitespace-nowrap">Julie Crafts</span>
                <span className="text-[10px] sm:text-xs text-slate-300 -mt-0.5 sm:-mt-1 leading-tight hidden sm:block">Handmade Excellence</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 text-slate-200 hover:text-white transition-all duration-200 font-medium rounded-lg hover:bg-slate-700/50 group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 flex-shrink-0">
              {/* Desktop Search & Chat */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex h-9 w-9 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Chat Support - only show for authenticated users */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors"
                  onClick={() => {
                    // Dispatch custom event to open chat widget
                    window.dispatchEvent(new CustomEvent('openChatWidget'))
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {isClient && chatUnreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] text-white bg-amber-500 border-0"
                    >
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Notifications - only show for authenticated users */}
              {isAuthenticated && (
                <NotificationBell className="h-8 w-8 sm:h-9 sm:w-9" />
              )}

              {/* Cart */}
              <Link href="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isClient && state.itemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] text-white bg-red-500 border-0"
                    >
                      {state.itemCount > 9 ? '9+' : state.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Auth Buttons - Mobile & Desktop */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 sm:h-9 sm:px-3 md:px-4 text-[11px] sm:text-xs md:text-sm font-medium hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors whitespace-nowrap"
                    asChild
                  >
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8 px-2 sm:h-9 sm:px-3 md:px-4 text-[11px] sm:text-xs md:text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm whitespace-nowrap"
                    asChild
                  >
                    <Link href="/register">
                      Sign Up
                    </Link>
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors"
                    >
                      <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                        <AvatarImage src={isClient ? profileImage || undefined : undefined} alt={user?.name || 'Profile'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs">
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
                      <Link href="/orders">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden relative p-1.5 sm:p-2 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-colors"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="w-4 sm:w-5 h-0.5 bg-slate-200 transition-all duration-200"></div>
                      <div className="w-4 sm:w-5 h-0.5 bg-slate-200 transition-all duration-200"></div>
                      <div className="w-4 sm:w-5 h-0.5 bg-slate-200 transition-all duration-200"></div>
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0 bg-slate-800 border-l border-slate-700">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
                      <Logo 
                        variant="full" 
                        size="md" 
                        dark={true}
                        showTagline={false}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8 hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <span className="sr-only">Close menu</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>

                    {/* Navigation Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-800">
                      <nav className="p-6 space-y-6">
                        {/* Main Navigation */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Navigation
                          </h3>
                          {navItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center px-3 py-2.5 text-slate-200 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200 group"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="font-medium text-base">{item.name}</span>
                              <svg 
                                className="ml-auto h-4 w-4 text-slate-400 group-hover:text-amber-400 transition-colors" 
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
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Quick Actions
                          </h3>
                          <Link href="/products" onClick={() => setIsOpen(false)}>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start px-3 py-2.5 h-auto text-slate-200 hover:text-amber-400 hover:bg-slate-700/50"
                            >
                              <Search className="mr-3 h-4 w-4" />
                              <span className="font-medium">Search Products</span>
                            </Button>
                          </Link>
                          {isAuthenticated && (
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start px-3 py-2.5 h-auto text-slate-200 hover:text-amber-400 hover:bg-slate-700/50 relative"
                              onClick={() => {
                                setIsOpen(false)
                                window.dispatchEvent(new CustomEvent('openChatWidget'))
                              }}
                            >
                              <MessageCircle className="mr-3 h-4 w-4" />
                              <span className="font-medium">Chat Support</span>
                              {isClient && chatUnreadCount > 0 && (
                                <Badge className="ml-auto bg-amber-500 text-white text-xs">
                                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                                </Badge>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {/* Authentication Section */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Account
                          </h3>
                          {isAuthenticated ? (
                            <div className="space-y-3">
                              {/* User Info */}
                              <div className="px-3 py-2.5 bg-slate-700/50 rounded-lg border border-slate-600">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={isClient ? profileImage || undefined : undefined} alt={user?.name || 'Profile'} />
                                    <AvatarFallback className="bg-amber-500 text-white text-xs">
                                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                  </div>
                                </div>
                              </div>

                              {/* User Actions */}
                              <Link href="/profile" onClick={() => setIsOpen(false)}>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start px-3 py-2.5 h-auto text-slate-200 hover:text-amber-400 hover:bg-slate-700/50"
                                >
                                  <User className="mr-3 h-4 w-4" />
                                  <span className="font-medium">My Profile</span>
                                </Button>
                              </Link>
                              <Link href="/orders" onClick={() => setIsOpen(false)}>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start px-3 py-2.5 h-auto text-slate-200 hover:text-amber-400 hover:bg-slate-700/50"
                                >
                                  <ShoppingBag className="mr-3 h-4 w-4" />
                                  <span className="font-medium">My Orders</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start px-3 py-2.5 h-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
                              <Button 
                                variant="outline" 
                                className="w-full h-11 border-slate-600 hover:bg-slate-700/50 text-slate-200 hover:text-white font-medium"
                                asChild
                              >
                                <Link href="/login" onClick={() => setIsOpen(false)}>
                                  Sign In
                                </Link>
                              </Button>
                              <Button 
                                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
                                asChild
                              >
                                <Link href="/register" onClick={() => setIsOpen(false)}>
                                  Create Account
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </nav>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-700 bg-slate-900">
                      <p className="text-xs text-slate-400 text-center">
                        © {new Date().getFullYear()} Julie's Crafts. All rights reserved.
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Widget */}
      <ChatWidget />
    </>
  )
}
