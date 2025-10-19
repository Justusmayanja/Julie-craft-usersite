import { Hero } from "@/components/hero"
import { FeaturedProducts } from "@/components/featured-products"
import { Categories } from "@/components/categories"
import { About } from "@/components/about"
import { Testimonials } from "@/components/testimonials"

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <About />
      <Testimonials />
    </>
  )
}