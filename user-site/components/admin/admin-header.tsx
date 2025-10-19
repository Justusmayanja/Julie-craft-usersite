"use client"

import { useState } from "react"
import { Bell, Search, User, Settings, LogOut, Menu, ChevronDown, Home, AlertTriangle, ShoppingCart, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/95 border-b border-gray-200/60 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shadow-sm min-w-0">
      {/* Left side - Mobile menu button and breadcrumb */}
      <div className="flex items-center space-x-4 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden hover:bg-gray-100 rounded-lg flex-shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>
        
        {/* Enhanced Breadcrumb Navigation */}
        <nav className="hidden md:flex items-center space-x-3 text-sm min-w-0" aria-label="Breadcrumb">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="p-1 bg-gray-100 rounded-md">
              <Home className="w-3 h-3" />
            </div>
            <span className="font-medium">Admin</span>
          </div>
          <div className="text-gray-300 font-light">/</div>
          <span className="text-gray-900 font-semibold bg-blue-50 px-2 py-1 rounded-md">Dashboard</span>
        </nav>
      </div>

      {/* Right side - Search, notifications, and user menu */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {/* Premium Search Bar */}
        <div className="hidden lg:flex relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white focus:shadow-lg transition-all duration-300 w-64 xl:w-80 placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Premium Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 group"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg ring-2 ring-white">
            3
          </span>
        </Button>

          {/* Premium Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-3 z-50 backdrop-blur-sm">
              <div className="px-5 py-3 border-b border-gray-100/80">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                  <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">3 new</Badge>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-5 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-red-500">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Low stock alert</p>
                      <p className="text-xs text-gray-600 mt-1">Blue Glazed Vase is running low</p>
                      <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-emerald-500">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">New order received</p>
                      <p className="text-xs text-gray-600 mt-1">Order #ORD-005 from Sarah Johnson</p>
                      <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Banknote className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Payment confirmed</p>
                      <p className="text-xs text-gray-600 mt-1">610,000 UGX payment processed</p>
                      <p className="text-xs text-gray-400 mt-1">8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100/80">
                <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                  View all notifications
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Premium User Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-200/60 hover:bg-blue-50/50 rounded-r-xl py-2 pr-2 sm:pr-3 transition-all duration-200 group min-w-0"
          >
            <div className="hidden xl:block text-right min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user?.first_name || user?.full_name || 'Admin User'
                }
              </p>
              <p className="text-xs text-gray-500 font-medium truncate">
                {user?.email || 'admin@juliecraft.com'}
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <Avatar
                src={user?.avatar_url}
                alt={user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user?.first_name || user?.full_name || 'Admin User'
                }
                fallback={user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user?.first_name || user?.full_name || 'Admin User'
                }
                size="md"
                className="border-2 border-blue-200/50 shadow-md group-hover:shadow-lg transition-shadow"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
          </button>

          {/* Premium User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/50 py-3 z-50 backdrop-blur-sm">
              <div className="px-5 py-4 border-b border-gray-100/80">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={user?.avatar_url}
                    alt={user?.name || 'Admin User'}
                    fallback={user?.name || 'Admin User'}
                    size="md"
                    className="shadow-md"
                  />
                  <div>
                    <p className="font-bold text-gray-900">
                      {user?.name || 'Admin User'}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {user?.email || 'admin@juliecraft.com'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                <button 
                  onClick={() => {
                    router.push('/profile')
                    setShowUserMenu(false)
                  }}
                  className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                >
                  <div className="p-1 bg-blue-100 rounded-md">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  <span>Profile Settings</span>
                </button>
                <button 
                  onClick={() => {
                    router.push('/account')
                    setShowUserMenu(false)
                  }}
                  className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                >
                  <div className="p-1 bg-blue-100 rounded-md">
                    <Settings className="w-3 h-3 text-blue-600" />
                  </div>
                  <span>Account Settings</span>
                </button>
              </div>
              
              <div className="border-t border-gray-100/80 pt-2">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
                >
                  <div className="p-1 bg-red-100 rounded-md">
                    <LogOut className="w-3 h-3 text-red-600" />
                  </div>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

