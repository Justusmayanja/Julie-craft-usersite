"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Save, CreditCard } from "lucide-react"

export default function PaymentSettingsPage() {
  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Settings</h1>
              <p className="text-gray-600 mt-1 text-base">Configure payment methods and tax settings</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Payment Methods */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-8 h-8 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900">Stripe</div>
                      <div className="text-sm text-gray-600">Credit & Debit Cards</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-8 h-8 text-purple-500" />
                    <div>
                      <div className="font-medium text-gray-900">PayPal</div>
                      <div className="text-sm text-gray-600">PayPal & Pay Later</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Tax Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tax Rate (%)</label>
                  <Input type="number" defaultValue="8.5" step="0.1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tax Collection</label>
                  <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="automatic">Automatic (by location)</option>
                    <option value="manual">Manual configuration</option>
                    <option value="disabled">Disabled</option>
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
