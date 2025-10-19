"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"

export default function ShippingSettingsPage() {
  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shipping Settings</h1>
              <p className="text-gray-600 mt-1 text-base">Configure shipping zones, rates, and packaging options</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Shipping Zones */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Zones</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Domestic Shipping</div>
                    <div className="text-sm text-gray-600">United States</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">23,400 - 50,700 UGX</div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">International Shipping</div>
                    <div className="text-sm text-gray-600">Canada, Europe</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">62,400 - 140,400 UGX</div>
                    <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packaging Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Packaging Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Default Box Size</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="small">Small (6x4x2 inches)</option>
                    <option value="medium">Medium (10x8x4 inches)</option>
                    <option value="large">Large (14x12x6 inches)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Packaging Material</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="eco">Eco-friendly packaging</option>
                    <option value="standard">Standard packaging</option>
                    <option value="premium">Premium gift packaging</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
