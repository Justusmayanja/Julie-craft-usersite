import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductCatalog } from "@/components/product-catalog"

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <ProductCatalog />
      </main>
      <Footer />
    </div>
  )
}
