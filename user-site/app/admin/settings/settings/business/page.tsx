"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"

export default function BusinessSettingsPage() {
  const businessSettings = {
    businessName: "JulieCraft",
    email: "julie@juliecraft.com",
    phone: "+1 (555) 123-4567",
    address: "123 Artisan Way",
    city: "Portland",
    state: "OR",
    zipCode: "97201",
    country: "United States",
    website: "https://juliecraft.com",
    description: "Handmade crafts created with love and passion. Each piece tells a unique story of artisanal craftsmanship.",
    logo: "/julie-logo.jpeg",
    timezone: "America/Los_Angeles",
    currency: "UGX"
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Information</h1>
              <p className="text-gray-600 mt-1 text-base">Manage your business details and company information</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Business Information */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Business Name</label>
                  <Input defaultValue={businessSettings.businessName} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <Input type="email" defaultValue={businessSettings.email} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Phone</label>
                  <Input defaultValue={businessSettings.phone} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Website</label>
                  <Input defaultValue={businessSettings.website} />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Business Description</label>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  rows={3}
                  defaultValue={businessSettings.description}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Currency</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Timezone</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/New_York">Eastern Time</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Country</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Address */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Business Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Street Address</label>
                  <Input defaultValue={businessSettings.address} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                    <Input defaultValue={businessSettings.city} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">State</label>
                    <Input defaultValue={businessSettings.state} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">ZIP Code</label>
                    <Input defaultValue={businessSettings.zipCode} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
