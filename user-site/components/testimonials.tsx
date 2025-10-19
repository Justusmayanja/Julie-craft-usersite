export function Testimonials() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Placeholder for testimonials */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">
              "Absolutely beautiful products! The quality is exceptional and the craftsmanship is outstanding."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Sarah Johnson</h4>
                <p className="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">
              "I love supporting local artisans through JulieCraft. Every purchase feels meaningful."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Michael Chen</h4>
                <p className="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">
              "The attention to detail in these handmade products is incredible. Highly recommended!"
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold">Emily Davis</h4>
                <p className="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}