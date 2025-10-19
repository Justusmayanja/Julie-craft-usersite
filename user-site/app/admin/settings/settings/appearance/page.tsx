"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, Palette } from "lucide-react"

export default function AppearanceSettingsPage() {
  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Appearance Settings</h1>
              <p className="text-gray-600 mt-1 text-base">Customize the look and feel of your admin dashboard</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Appearance Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Appearance Settings</h3>
                <p className="text-gray-600">Theme and appearance customization coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
