"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Shield,
  Key,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Download,
  RefreshCw,
  Lock,
  Unlock
} from "lucide-react"

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [accountData] = useState({
    accountId: "ACC-001",
    accountType: "Premium",
    createdDate: "2022-01-15",
    lastPasswordChange: "2023-06-15",
    twoFactorEnabled: false,
    loginSessions: 3,
    apiKeysCount: 2,
    storageUsed: "156 MB",
    storageLimit: "1 GB"
  })

  const [recentActivity] = useState([
    {
      id: "ACT-001",
      action: "Password Changed",
      timestamp: "2023-09-18 10:30 AM",
      location: "Portland, OR",
      device: "Chrome on MacOS",
      status: "success"
    },
    {
      id: "ACT-002", 
      action: "Login",
      timestamp: "2023-09-18 08:15 AM",
      location: "Portland, OR", 
      device: "Chrome on MacOS",
      status: "success"
    },
    {
      id: "ACT-003",
      action: "API Key Generated",
      timestamp: "2023-09-17 02:45 PM",
      location: "Portland, OR",
      device: "Chrome on MacOS", 
      status: "success"
    },
    {
      id: "ACT-004",
      action: "Failed Login Attempt",
      timestamp: "2023-09-16 11:20 PM",
      location: "Unknown",
      device: "Unknown",
      status: "warning"
    },
  ])

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
              <p className="text-gray-600 mt-1 text-base">Manage your account security and preferences</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Account Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Account Type</p>
                  <p className="text-xl font-bold text-gray-900">{accountData.accountType}</p>
                  <p className="text-xs text-gray-500">Premium features</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Active Sessions</p>
                  <p className="text-xl font-bold text-gray-900">{accountData.loginSessions}</p>
                  <p className="text-xs text-gray-500">Login sessions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">API Keys</p>
                  <p className="text-xl font-bold text-gray-900">{accountData.apiKeysCount}</p>
                  <p className="text-xs text-gray-500">Active keys</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Download className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Storage Used</p>
                  <p className="text-xl font-bold text-gray-900">{accountData.storageUsed}</p>
                  <p className="text-xs text-gray-500">Of {accountData.storageLimit}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Password Change */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.current ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Update Password
                    </Button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Badge className={accountData.twoFactorEnabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {accountData.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Button variant="outline" className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                    <Smartphone className="w-4 h-4 mr-2" />
                    {accountData.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-1.5 rounded-lg ${
                        activity.status === 'success' ? 'bg-emerald-100' :
                        activity.status === 'warning' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {activity.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : activity.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{activity.action}</p>
                          <Badge className={
                            activity.status === 'success' ? "bg-emerald-100 text-emerald-700" :
                            activity.status === 'warning' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                          }>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{activity.timestamp}</p>
                        <p className="text-xs text-gray-500">{activity.location} • {activity.device}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full bg-white hover:bg-gray-50 border-gray-300">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Export Data</div>
                      <div className="text-sm text-gray-600">Download your account data</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Backup Account</div>
                      <div className="text-sm text-gray-600">Create account backup</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-red-50 hover:text-red-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Delete Account</div>
                      <div className="text-sm text-gray-600">Permanently delete account</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Current Session</div>
                      <div className="text-sm text-gray-600">Chrome on MacOS • Portland, OR</div>
                      <div className="text-xs text-gray-500">Started 2 hours ago</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Mobile Session</div>
                      <div className="text-sm text-gray-600">Safari on iPhone • Portland, OR</div>
                      <div className="text-xs text-gray-500">Started 1 day ago</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300">
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
