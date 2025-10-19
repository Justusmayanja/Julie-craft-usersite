"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderOpen, 
  Users, 
  Settings, 
  Warehouse,
  Palette,
  TrendingUp,
  Activity,
  Zap,
  Store,
  Truck,
  CreditCard,
  Bell,
  Shield,
  Globe,
  ChevronDown,
  X,
  FileText,
  Image as ImageIcon,
  Layout,
  Newspaper,
  UserCircle,
  Cog
} from "lucide-react"

// Type definitions
interface SubMenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeColor?: string
  hasSubmenu?: boolean
  submenu?: SubMenuItem[]
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
      {
        name: "Analytics",
        href: "/admin/analytics",
        icon: TrendingUp,
      },
    ]
  },
  {
    title: "Commerce",
    items: [
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
        badge: "9",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
        badge: "12",
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: FolderOpen,
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: Warehouse,
        badge: "3",
        badgeColor: "bg-red-500",
      },
    ]
  },
  {
    title: "Content",
    items: [
      {
        name: "Pages",
        href: "/admin/content/pages",
        icon: FileText,
        badge: "5",
      },
      {
        name: "Media Library",
        href: "/admin/content/media",
        icon: ImageIcon,
        badge: "24",
      },
      {
        name: "Blog & News",
        href: "/admin/content/blog",
        icon: Newspaper,
        badge: "3",
      },
      {
        name: "Homepage",
        href: "/admin/content/homepage",
        icon: Layout,
      },
    ]
  },
  {
    title: "Management",
    items: [
      {
        name: "Customers",
        href: "/admin/customers",
        icon: Users,
      },
      {
        name: "Profile",
        href: "/admin/profile",
        icon: UserCircle,
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        hasSubmenu: true,
        submenu: [
          {
            name: "Business Info",
            href: "/admin/settings/business",
            icon: Store,
          },
          {
            name: "Shipping",
            href: "/admin/settings/shipping",
            icon: Truck,
          },
          {
            name: "Payments",
            href: "/admin/settings/payments",
            icon: CreditCard,
          },
          {
            name: "Notifications",
            href: "/admin/settings/notifications",
            icon: Bell,
          },
          {
            name: "Security",
            href: "/admin/settings/security",
            icon: Shield,
          },
          {
            name: "Users & Permissions",
            href: "/admin/settings/users",
            icon: Users,
          },
          {
            name: "Appearance",
            href: "/admin/settings/appearance",
            icon: Palette,
          },
          {
            name: "Integrations",
            href: "/admin/settings/integrations",
            icon: Globe,
          },
        ]
      },
    ]
  },
]

interface AdminSidebarProps {
  onClose?: () => void
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(
    // Auto-expand Settings if we're on a settings page
    pathname.startsWith('/settings') ? ['Settings'] : []
  )

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const handleLinkClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 768 && onClose) {
      onClose()
    }
  }

  return (
    <div className="w-64 min-w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 h-screen md:h-full flex flex-col backdrop-blur-sm">
      {/* Brand Header - Enhanced */}
      <div className="flex-shrink-0 p-4 bg-slate-800/95 backdrop-blur-sm border-b border-slate-600">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30">
              <Image 
                src="/julie-logo.jpeg" 
                alt="JulieCraft Logo" 
                fill
                sizes="40px"
                className="object-contain p-1.5"
                priority
                onError={(e) => {
                  // Fallback to a simple icon if image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white tracking-tight truncate">JulieCraft</h1>
              <p className="text-xs text-amber-400 font-semibold tracking-wide truncate">Admin Dashboard</p>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>
      
      {/* Navigation Sections - Enhanced */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-7 min-h-0">
        {navigationSections.map((section) => (
          <div key={section.title} className="min-w-0">
            <div className="flex items-center space-x-2 px-3 mb-3 min-w-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">
                {section.title}
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent"></div>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                const isExpanded = expandedMenus.includes(item.name)
                const hasActiveSubmenu = item.submenu?.some(subItem => pathname === subItem.href)
                
                return (
                  <div key={item.name}>
                    {/* Main Navigation Item */}
                    {item.hasSubmenu ? (
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                          isActive || hasActiveSubmenu
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-md ring-1 ring-amber-400/50 backdrop-blur-sm"
                            : "text-slate-300 hover:bg-slate-700/80 hover:text-amber-300 hover:shadow-md hover:ring-1 hover:ring-slate-600/30 hover:backdrop-blur-sm",
                        )}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={cn(
                            "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                            isActive || hasActiveSubmenu
                              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm" 
                              : "bg-slate-700/80 text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-400"
                          )}>
                            <item.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="tracking-tight truncate">{item.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Enhanced Badge */}
                          {item.badge && (
                            <span className={cn(
                              "px-2 py-1 text-xs font-bold rounded-full shadow-sm ring-1",
                              item.badgeColor === "bg-red-500" 
                                ? "bg-red-500 text-white ring-red-200" 
                                : isActive || hasActiveSubmenu
                                ? "bg-amber-500 text-white ring-amber-200" 
                                : "bg-slate-600 text-slate-200 ring-slate-500 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:ring-amber-400/50"
                            )}>
                              {item.badge}
                            </span>
                          )}
                          
                          {/* Chevron */}
                          <div className={cn(
                            "transition-transform duration-200",
                            isExpanded ? "rotate-180" : "rotate-0"
                          )}>
                            <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      
                        {/* Active Indicator - Enhanced */}
                        {(isActive || hasActiveSubmenu) && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-r-full shadow-sm"></div>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                          isActive
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-md ring-1 ring-amber-400/50 backdrop-blur-sm"
                            : "text-slate-300 hover:bg-slate-700/80 hover:text-amber-300 hover:shadow-md hover:ring-1 hover:ring-slate-600/30 hover:backdrop-blur-sm",
                        )}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={cn(
                            "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                            isActive 
                              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm" 
                              : "bg-slate-700/80 text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-400"
                          )}>
                            <item.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="tracking-tight truncate">{item.name}</span>
                        </div>
                        
                        {/* Enhanced Badge */}
                        {item.badge && (
                          <span className={cn(
                            "px-2 py-1 text-xs font-bold rounded-full shadow-sm ring-1",
                            item.badgeColor === "bg-red-500" 
                              ? "bg-red-500 text-white ring-red-200" 
                              : isActive 
                              ? "bg-amber-500 text-white ring-amber-200" 
                              : "bg-slate-600 text-slate-200 ring-slate-500 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:ring-amber-400/50"
                          )}>
                            {item.badge}
                          </span>
                        )}
                        
                        {/* Active Indicator - Enhanced */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-r-full shadow-sm"></div>
                        )}
                      </Link>
                    )}
                    
                    {/* Submenu */}
                    {item.hasSubmenu && item.submenu && (
                      <div className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-600/50 pl-4 min-w-0">
                          {item.submenu.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative min-w-0",
                                  isSubActive
                                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-sm"
                                    : "text-slate-400 hover:bg-slate-700/60 hover:text-amber-300 hover:shadow-sm",
                                )}
                              >
                                <div className={cn(
                                  "p-1 rounded-md transition-all duration-200 flex-shrink-0",
                                  isSubActive 
                                    ? "bg-amber-500 text-white shadow-sm" 
                                    : "bg-slate-700/60 text-slate-500 group-hover:bg-amber-500/20 group-hover:text-amber-400"
                                )}>
                                  <subItem.icon className="h-3 w-3" />
                                </div>
                                <span className="tracking-tight truncate">{subItem.name}</span>
                                
                                {/* Sub-item Active Indicator */}
                                {isSubActive && (
                                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-amber-500 rounded-r-full"></div>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* System Status Footer - Enhanced */}
      <div className="flex-shrink-0 p-4 bg-slate-800/95 backdrop-blur-sm border-t border-slate-600">
        <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/60 p-4 rounded-xl border border-slate-500/40 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-emerald-100 rounded-lg">
                <Activity className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">System Status</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300 font-semibold tracking-tight">All systems operational</p>
            <div className="flex items-center space-x-1 bg-emerald-500/20 px-2 py-1 rounded-full">
              <Zap className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}