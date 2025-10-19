export function Categories() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Placeholder for categories */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Ceramics</h3>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Textiles</h3>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Jewelry</h3>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Woodwork</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
