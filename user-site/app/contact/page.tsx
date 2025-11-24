import dynamic from "next/dynamic"
import { PageLoading } from "@/components/page-loading"

const ContactPage = dynamic(() => import("@/components/contact-page").then(mod => ({ default: mod.ContactPage })), {
  loading: () => <PageLoading />,
  ssr: true
})

export default function Contact() {
  return (
    <main>
      <ContactPage />
    </main>
  )
}
