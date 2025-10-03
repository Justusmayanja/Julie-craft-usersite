import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Gallery } from "@/components/gallery"

export default function GalleryPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Gallery />
      </main>
      <Footer />
    </div>
  )
}
