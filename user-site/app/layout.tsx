import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { RoleProvider } from "@/contexts/role-context"
import { CartProvider } from "@/contexts/cart-context"
import { ToastProvider } from "@/contexts/toast-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { LayoutContent } from "@/components/layout-content"
import { NavigationProgress } from "@/components/navigation-progress"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JulieCraft - Handmade Artisan Products",
  description: "Discover beautiful handmade artisan products crafted with love and tradition. Shop unique ceramics, textiles, jewelry, and more.",
  keywords: ["handmade", "artisan", "crafts", "ceramics", "textiles", "jewelry", "traditional", "handcrafted"],
  authors: [{ name: "JulieCraft" }],
  creator: "JulieCraft",
  publisher: "JulieCraft",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "JulieCraft - Handmade Artisan Products",
    description: "Discover beautiful handmade artisan products crafted with love and tradition.",
    url: "/",
    siteName: "JulieCraft",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "JulieCraft Handmade Products",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JulieCraft - Handmade Artisan Products",
    description: "Discover beautiful handmade artisan products crafted with love and tradition.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className} overflow-x-hidden`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NavigationProgress />
          <AuthProvider>
            <RoleProvider>
              <CartProvider>
                <ToastProvider>
                  <LayoutContent>
                    {children}
                  </LayoutContent>
                  <Toaster />
                </ToastProvider>
              </CartProvider>
            </RoleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}