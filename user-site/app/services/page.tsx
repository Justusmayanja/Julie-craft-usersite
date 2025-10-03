import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ServicesPage } from "@/components/services-page"

export default function Services() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <ServicesPage />
      </main>
      <Footer />
    </div>
  )
}
