import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ShoppingCartPage } from "@/components/shopping-cart-page"

export default function CartPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <ShoppingCartPage />
      </main>
      <Footer />
    </div>
  )
}
