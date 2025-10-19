export function About() {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">About JulieCraft</h2>
          <p className="text-lg text-gray-600 mb-8">
            We are passionate about preserving traditional craftsmanship and bringing you 
            the finest handmade products from skilled artisans around the world.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-gray-600">Every product is carefully crafted with attention to detail</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Tradition</h3>
              <p className="text-gray-600">Preserving centuries-old crafting techniques</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">Supporting local artisans and their communities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
