import dynamic from "next/dynamic"
import { PageLoading } from "@/components/page-loading"

const AboutPage = dynamic(() => import("@/components/about-page").then(mod => ({ default: mod.AboutPage })), {
  loading: () => <PageLoading />,
  ssr: true
})

export default function About() {
  return (
    <main>
      <AboutPage />
    </main>
  )
}
