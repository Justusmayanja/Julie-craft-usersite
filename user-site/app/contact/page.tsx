import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ContactPage } from "@/components/contact-page"

export default function Contact() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <ContactPage />
      </main>
      <Footer />
    </div>
  )
}
