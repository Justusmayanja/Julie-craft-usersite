import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AboutPage } from "@/components/about-page"

export default function About() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <AboutPage />
      </main>
      <Footer />
    </div>
  )
}
