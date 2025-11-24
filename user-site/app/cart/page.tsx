import dynamic from "next/dynamic"
import { PageLoading } from "@/components/page-loading"

const ShoppingCartPage = dynamic(() => import("@/components/shopping-cart-page").then(mod => ({ default: mod.ShoppingCartPage })), {
  loading: () => <PageLoading />,
  ssr: true
})

export default function CartPage() {
  return (
    <main>
      <ShoppingCartPage />
    </main>
  )
}
