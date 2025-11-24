import dynamic from "next/dynamic"
import { PageLoading } from "@/components/page-loading"

const OrderConfirmation = dynamic(() => import("@/components/order-confirmation").then(mod => ({ default: mod.OrderConfirmation })), {
  loading: () => <PageLoading />,
  ssr: true
})

export default function OrderConfirmationPage() {
  return (
    <main>
      <OrderConfirmation />
    </main>
  )
}
