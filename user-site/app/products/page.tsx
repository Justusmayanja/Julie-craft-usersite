import dynamic from "next/dynamic"
import { PageLoading } from "@/components/page-loading"

const ProductCatalog = dynamic(() => import("@/components/product-catalog").then(mod => ({ default: mod.ProductCatalog })), {
  loading: () => <PageLoading />,
  ssr: true
})

export default function ProductsPage() {
  return (
    <main>
      <ProductCatalog />
    </main>
  )
}
