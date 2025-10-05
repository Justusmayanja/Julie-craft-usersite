import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { OrderConfirmation } from "@/components/order-confirmation"

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <OrderConfirmation />
      </main>
      <Footer />
    </div>
  )
}
