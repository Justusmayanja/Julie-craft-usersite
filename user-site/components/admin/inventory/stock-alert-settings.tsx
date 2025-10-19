"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  AlertTriangle, 
  Settings, 
  Mail, 
  Bell, 
  Save, 
  RefreshCw,
  BarChart3,
  Package,
  TrendingDown,
  CheckCircle,
  XCircle,
  Info,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface AlertSettings {
  low_stock_threshold: number
  critical_stock_threshold: number
  email_notifications: boolean
  dashboard_notifications: boolean
  notification_frequency: 'immediate' | 'daily' | 'weekly'
  email_recipients: string[]
  auto_reorder_enabled: boolean
  reorder_buffer_percentage: number
  category_specific_thresholds: Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>
  product_specific_thresholds: Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>
}

interface AlertStatistics {
  total_items: number
  low_stock_count: number
  critical_stock_count: number
  out_of_stock_count: number
  low_stock_percentage: number
  critical_stock_percentage: number
  out_of_stock_percentage: number
}

interface CategoryOption {
  id: string
  name: string
  low_stock_threshold?: number
  critical_stock_threshold?: number
  enabled?: boolean
}

interface StockAlertSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function StockAlertSettings({ isOpen, onClose }: StockAlertSettingsProps) {
  const [settings, setSettings] = useState<AlertSettings>({
    low_stock_threshold: 20,
    critical_stock_threshold: 5,
    email_notifications: true,
    dashboard_notifications: true,
    notification_frequency: 'immediate',
    email_recipients: [],
    auto_reorder_enabled: false,
    reorder_buffer_percentage: 10,
    category_specific_thresholds: {},
    product_specific_thresholds: {}
  })
  
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState("")

  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/inventory/alert-settings', {
        method: 'PUT', // Use PUT to get statistics
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch alert settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      setStatistics(data.statistics)
      setCategories(data.category_options || [])
    } catch (err) {
      console.error('Error fetching alert settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load alert settings')
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load alert settings'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      const response = await fetch('/api/inventory/alert-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save alert settings')
      }

      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Stock alert settings have been updated successfully'
      })
      
      // Refresh statistics
      await fetchSettings()
    } catch (err) {
      console.error('Error saving alert settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save alert settings')
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to save alert settings'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof AlertSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const addEmailRecipient = () => {
    if (newEmail && newEmail.includes('@') && !settings.email_recipients.includes(newEmail)) {
      updateSetting('email_recipients', [...settings.email_recipients, newEmail])
      setNewEmail("")
    }
  }

  const removeEmailRecipient = (email: string) => {
    updateSetting('email_recipients', settings.email_recipients.filter(e => e !== email))
  }

  const updateCategoryThreshold = (categoryId: string, field: 'low_stock_threshold' | 'critical_stock_threshold', value: number) => {
    const updated = {
      ...settings.category_specific_thresholds,
      [categoryId]: {
        ...settings.category_specific_thresholds[categoryId],
        [field]: value,
        enabled: true
      }
    }
    updateSetting('category_specific_thresholds', updated)
  }

  const toggleCategoryThreshold = (categoryId: string, enabled: boolean) => {
    const updated = {
      ...settings.category_specific_thresholds,
      [categoryId]: {
        ...settings.category_specific_thresholds[categoryId],
        enabled
      }
    }
    updateSetting('category_specific_thresholds', updated)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Stock Alert Settings</h2>
                <p className="text-blue-100 text-sm sm:text-base">Configure inventory alert thresholds and notifications</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Loading Alert Settings</h3>
              <p className="text-slate-600 font-medium">Fetching your latest configuration...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl mb-6 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unable to Load Settings</h3>
              <p className="text-slate-600 font-medium mb-6">{error}</p>
              <Button onClick={fetchSettings} variant="outline" size="lg" className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm">
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Statistics Overview */}
              {statistics && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-slate-800">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <span>Current Alert Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.total_items}</div>
                        <div className="text-xs sm:text-sm text-blue-800 font-medium">Total Items</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xl sm:text-2xl font-bold text-amber-600">{statistics.low_stock_count}</div>
                        <div className="text-xs sm:text-sm text-amber-800 font-medium">Low Stock</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xl sm:text-2xl font-bold text-red-600">{statistics.critical_stock_count}</div>
                        <div className="text-xs sm:text-sm text-red-800 font-medium">Critical</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xl sm:text-2xl font-bold text-gray-600">{statistics.out_of_stock_count}</div>
                        <div className="text-xs sm:text-sm text-gray-800 font-medium">Out of Stock</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Global Threshold Settings */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-200/30">
                  <CardTitle className="flex items-center space-x-3 text-slate-800">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <span>Global Alert Thresholds</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="low-stock-threshold" className="text-sm font-semibold text-slate-700">
                        Low Stock Threshold (%)
                      </Label>
                      <div className="relative">
                        <Input
                          id="low-stock-threshold"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.low_stock_threshold}
                          onChange={(e) => updateSetting('low_stock_threshold', parseInt(e.target.value) || 20)}
                          className="w-full pl-3 pr-10 py-2.5 border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-lg transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">%</div>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        Alert when stock falls below this percentage of max capacity
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="critical-stock-threshold" className="text-sm font-semibold text-slate-700">
                        Critical Stock Threshold (%)
                      </Label>
                      <div className="relative">
                        <Input
                          id="critical-stock-threshold"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.critical_stock_threshold}
                          onChange={(e) => updateSetting('critical_stock_threshold', parseInt(e.target.value) || 5)}
                          className="w-full pl-3 pr-10 py-2.5 border-2 border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-lg transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">%</div>
                      </div>
                      <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        Urgent alert when stock falls below this percentage
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reorder-buffer" className="text-sm font-semibold text-slate-700">
                      Reorder Buffer Percentage (%)
                    </Label>
                    <div className="relative max-w-xs">
                      <Input
                        id="reorder-buffer"
                        type="number"
                        min="0"
                        max="100"
                        value={settings.reorder_buffer_percentage}
                        onChange={(e) => updateSetting('reorder_buffer_percentage', parseInt(e.target.value) || 10)}
                        className="w-full pl-3 pr-10 py-2.5 border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">%</div>
                    </div>
                    <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      Extra stock to order beyond the reorder point
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-200/30">
                  <CardTitle className="flex items-center space-x-3 text-slate-800">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-700">Dashboard Notifications</Label>
                        <p className="text-sm text-slate-600">Show alerts in the admin dashboard</p>
                      </div>
                      <Switch
                        checked={settings.dashboard_notifications}
                        onCheckedChange={(checked) => updateSetting('dashboard_notifications', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-700">Email Notifications</Label>
                        <p className="text-sm text-slate-600">Send email alerts to specified recipients</p>
                      </div>
                      <Switch
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-700">Auto Reorder</Label>
                        <p className="text-sm text-slate-600">Automatically create reorder requests</p>
                      </div>
                      <Switch
                        checked={settings.auto_reorder_enabled}
                        onCheckedChange={(checked) => updateSetting('auto_reorder_enabled', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">Notification Frequency</Label>
                    <Select
                      value={settings.notification_frequency}
                      onValueChange={(value: 'immediate' | 'daily' | 'weekly') => updateSetting('notification_frequency', value)}
                    >
                      <SelectTrigger className="w-full sm:w-1/2 border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.email_notifications && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <Label className="text-sm font-semibold text-slate-700">Email Recipients</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Enter email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
                          className="flex-1 border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg"
                        />
                        <Button 
                          onClick={addEmailRecipient} 
                          variant="outline"
                          className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-lg"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {settings.email_recipients.map((email, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-2 bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
                            <Mail className="w-3 h-3" />
                            <span className="text-sm">{email}</span>
                            <button
                              onClick={() => removeEmailRecipient(email)}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category-Specific Settings */}
              {categories.length > 0 && (
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50/50 border-b border-green-200/30">
                    <CardTitle className="flex items-center space-x-3 text-slate-800">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <span>Category-Specific Thresholds</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const categorySettings = settings.category_specific_thresholds[category.id] || {
                          low_stock_threshold: settings.low_stock_threshold,
                          critical_stock_threshold: settings.critical_stock_threshold,
                          enabled: false
                        }

                        return (
                          <div key={category.id} className={`border-2 rounded-xl p-4 space-y-4 transition-all duration-200 ${
                            categorySettings.enabled 
                              ? 'border-green-200 bg-green-50/50' 
                              : 'border-slate-200 bg-slate-50/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${categorySettings.enabled ? 'bg-green-100' : 'bg-slate-100'}`}>
                                  <Package className={`w-4 h-4 ${categorySettings.enabled ? 'text-green-600' : 'text-slate-400'}`} />
                                </div>
                                <h4 className="font-semibold text-slate-800">{category.name}</h4>
                              </div>
                              <Switch
                                checked={categorySettings.enabled}
                                onCheckedChange={(checked) => toggleCategoryThreshold(category.id, checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>
                            
                            {categorySettings.enabled && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-11">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-slate-700">Low Stock Threshold (%)</Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={categorySettings.low_stock_threshold}
                                      onChange={(e) => updateCategoryThreshold(category.id, 'low_stock_threshold', parseInt(e.target.value) || 20)}
                                      className="w-full pl-3 pr-10 py-2.5 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 rounded-lg"
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">%</div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-slate-700">Critical Stock Threshold (%)</Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={categorySettings.critical_stock_threshold}
                                      onChange={(e) => updateCategoryThreshold(category.id, 'critical_stock_threshold', parseInt(e.target.value) || 5)}
                                      className="w-full pl-3 pr-10 py-2.5 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-lg"
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">%</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full sm:w-auto border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg px-6 py-2.5 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={saving} 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
