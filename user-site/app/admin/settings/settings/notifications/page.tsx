"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export default function NotificationSettingsPage() {
  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notification Settings</h1>
              <p className="text-gray-600 mt-1 text-base">Configure email notifications and alerts</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Email Notifications */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: "New Orders", description: "Get notified when new orders are placed" },
                { label: "Low Stock Alerts", description: "Alert when products are running low" },
                { label: "Customer Messages", description: "New customer inquiries and messages" },
                { label: "Payment Confirmations", description: "Successful payment notifications" },
                { label: "Weekly Reports", description: "Weekly business performance summary" },
              ].map((notification) => (
                <div key={notification.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{notification.label}</div>
                    <div className="text-sm text-gray-600">{notification.description}</div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
