import React, { useState } from 'react';
import { 
  Save, 
  Upload,
  Bell,
  Mail,
  Building,
  Users,
  CreditCard,
  Lock,
  Languages,
  Clock,
  Moon,
  Sun,
  ChevronRight,
  Shield,
  Database,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const CURRENCY_OPTIONS = [
  { value: 'MAD', label: 'MAD - Dirham Marocain (DH)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - Livre Sterling (£)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
  { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'it', label: 'Italiano (Italian)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
  { value: 'America/New_York', label: 'EST - Eastern Standard Time (UTC-5)' },
  { value: 'America/Chicago', label: 'CST - Central Standard Time (UTC-6)' },
  { value: 'America/Denver', label: 'MST - Mountain Standard Time (UTC-7)' },
  { value: 'America/Los_Angeles', label: 'PST - Pacific Standard Time (UTC-8)' },
  { value: 'Europe/London', label: 'GMT - Greenwich Mean Time (UTC+0)' },
  { value: 'Europe/Paris', label: 'CET - Central European Time (UTC+1)' },
  { value: 'Asia/Tokyo', label: 'JST - Japan Standard Time (UTC+9)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const BACKUP_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'day_pass', label: 'Day Pass' },
];

const GeneralSettings = ({ settings, updateSettings }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Gym Information</CardTitle>
        <CardDescription>
          Basic information about your gym and business details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="gym_name">Gym Name</Label>
          <Input 
            id="gym_name" 
            value={settings.gymName} 
            onChange={(e) => updateSettings({ ...settings, gymName: e.target.value })} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={settings.phone} 
              onChange={(e) => updateSettings({ ...settings, phone: e.target.value })} 
            />
          </div>
          <div>
            <Label htmlFor="email">Business Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={settings.email} 
              onChange={(e) => updateSettings({ ...settings, email: e.target.value })} 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Input 
            id="address" 
            value={settings.address} 
            onChange={(e) => updateSettings({ ...settings, address: e.target.value })} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input 
              id="city" 
              value={settings.city} 
              onChange={(e) => updateSettings({ ...settings, city: e.target.value })} 
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input 
              id="state" 
              value={settings.state} 
              onChange={(e) => updateSettings({ ...settings, state: e.target.value })} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipcode">Postal/Zip Code</Label>
            <Input 
              id="zipcode" 
              value={settings.zipCode} 
              onChange={(e) => updateSettings({ ...settings, zipCode: e.target.value })} 
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input 
              id="country" 
              value={settings.country} 
              onChange={(e) => updateSettings({ ...settings, country: e.target.value })} 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="website">Website</Label>
          <Input 
            id="website" 
            value={settings.website} 
            onChange={(e) => updateSettings({ ...settings, website: e.target.value })} 
          />
        </div>
        
        <div>
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center space-x-4 mt-2">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
              {settings.logo ? (
                <img src={settings.logo} alt="Gym Logo" className="max-h-full max-w-full" />
              ) : (
                <Building className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Logo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BusinessSettings = ({ settings, updateSettings }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Business Settings</CardTitle>
        <CardDescription>
          Configure payment and financial settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={settings.currency}
            onChange={(e) => updateSettings({ ...settings, currency: e.target.value })}
          >
            {CURRENCY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input 
            id="taxRate" 
            type="number"
            min="0"
            max="100" 
            value={settings.taxRate} 
            onChange={(e) => updateSettings({ ...settings, taxRate: e.target.value })} 
          />
        </div>
        
        <div>
          <Label>Payment Methods</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="payment_credit"
                checked={settings.paymentMethods.includes('credit_card')}
                onChange={(e) => {
                  const newMethods = e.target.checked 
                    ? [...settings.paymentMethods, 'credit_card'] 
                    : settings.paymentMethods.filter(m => m !== 'credit_card');
                  updateSettings({ ...settings, paymentMethods: newMethods });
                }}
                className="rounded"
              />
              <label htmlFor="payment_credit" className="text-sm">Credit Card</label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="payment_cash"
                checked={settings.paymentMethods.includes('cash')}
                onChange={(e) => {
                  const newMethods = e.target.checked 
                    ? [...settings.paymentMethods, 'cash'] 
                    : settings.paymentMethods.filter(m => m !== 'cash');
                  updateSettings({ ...settings, paymentMethods: newMethods });
                }}
                className="rounded"
              />
              <label htmlFor="payment_cash" className="text-sm">Cash</label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="payment_bank"
                checked={settings.paymentMethods.includes('bank_transfer')}
                onChange={(e) => {
                  const newMethods = e.target.checked 
                    ? [...settings.paymentMethods, 'bank_transfer'] 
                    : settings.paymentMethods.filter(m => m !== 'bank_transfer');
                  updateSettings({ ...settings, paymentMethods: newMethods });
                }}
                className="rounded"
              />
              <label htmlFor="payment_bank" className="text-sm">Bank Transfer</label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="payment_paypal"
                checked={settings.paymentMethods.includes('paypal')}
                onChange={(e) => {
                  const newMethods = e.target.checked 
                    ? [...settings.paymentMethods, 'paypal'] 
                    : settings.paymentMethods.filter(m => m !== 'paypal');
                  updateSettings({ ...settings, paymentMethods: newMethods });
                }}
                className="rounded"
              />
              <label htmlFor="payment_paypal" className="text-sm">PayPal</label>
            </div>
          </div>
        </div>
        
        <div>
          <Label>Default Membership Types</Label>
          <div className="space-y-4 mt-2">
            {settings.membershipTypes.map((membership, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border border-gray-200 rounded-md p-3">
                <div>
                  <Label htmlFor={`membership_type_${index}`} className="text-xs">Type</Label>
                  <select
                    id={`membership_type_${index}`}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={membership.type}
                    onChange={(e) => {
                      const newTypes = [...settings.membershipTypes];
                      newTypes[index].type = e.target.value;
                      updateSettings({ ...settings, membershipTypes: newTypes });
                    }}
                  >
                    {MEMBERSHIP_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`membership_price_${index}`} className="text-xs">Price</Label>
                  <Input 
                    id={`membership_price_${index}`} 
                    type="number"
                    min="0"
                    value={membership.price} 
                    onChange={(e) => {
                      const newTypes = [...settings.membershipTypes];
                      newTypes[index].price = e.target.value;
                      updateSettings({ ...settings, membershipTypes: newTypes });
                    }} 
                  />
                </div>
                <div>
                  <Label htmlFor={`membership_duration_${index}`} className="text-xs">Duration (days)</Label>
                  <Input 
                    id={`membership_duration_${index}`} 
                    type="number"
                    min="1"
                    value={membership.duration} 
                    onChange={(e) => {
                      const newTypes = [...settings.membershipTypes];
                      newTypes[index].duration = e.target.value;
                      updateSettings({ ...settings, membershipTypes: newTypes });
                    }} 
                  />
                </div>
              </div>
            ))}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                updateSettings({
                  ...settings,
                  membershipTypes: [...settings.membershipTypes, { type: 'monthly', price: 0, duration: 30 }]
                });
              }}
            >
              Add Membership Type
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationSettings = ({ settings, updateSettings }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configure when and how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base">Email Notifications</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="email_new_member"
                  checked={settings.emailNotifications.newMember}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        newMember: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_new_member" className="text-sm">New member sign up</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="email_payment"
                  checked={settings.emailNotifications.payment}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        payment: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_payment" className="text-sm">Payment received</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="email_payment_failed"
                  checked={settings.emailNotifications.paymentFailed}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        paymentFailed: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_payment_failed" className="text-sm">Payment failed</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="email_membership_expiring"
                  checked={settings.emailNotifications.membershipExpiring}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        membershipExpiring: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_membership_expiring" className="text-sm">Membership expiring</label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <Label className="text-base">System Notifications</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="system_new_member"
                  checked={settings.systemNotifications.newMember}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        newMember: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_new_member" className="text-sm">New member sign up</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="system_payment"
                  checked={settings.systemNotifications.payment}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        payment: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_payment" className="text-sm">Payment received</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="system_checkin"
                  checked={settings.systemNotifications.checkin}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        checkin: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_checkin" className="text-sm">Member check-in</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="system_capacity"
                  checked={settings.systemNotifications.capacity}
                  onChange={(e) => {
                    updateSettings({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        capacity: e.target.checked
                      }
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_capacity" className="text-sm">Class capacity reached</label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AppearanceSettings = ({ settings, updateSettings }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Appearance & Localization</CardTitle>
        <CardDescription>
          Customize your gym management system's appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {THEME_OPTIONS.map(option => (
              <div 
                key={option.value}
                className={`
                  border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-all
                  ${settings.theme === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
                onClick={() => updateSettings({ ...settings, theme: option.value })}
              >
                {option.value === 'light' && <Sun className="h-6 w-6 mb-2 text-amber-500" />}
                {option.value === 'dark' && <Moon className="h-6 w-6 mb-2 text-indigo-600" />}
                {option.value === 'system' && (
                  <div className="flex mb-2">
                    <Sun className="h-6 w-6 text-amber-500" />
                    <Moon className="h-6 w-6 text-indigo-600 -ml-1" />
                  </div>
                )}
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={settings.language}
            onChange={(e) => updateSettings({ ...settings, language: e.target.value })}
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={settings.timezone}
            onChange={(e) => updateSettings({ ...settings, timezone: e.target.value })}
          >
            {TIMEZONE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="dateFormat">Date Format</Label>
          <select
            id="dateFormat"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={settings.dateFormat}
            onChange={(e) => updateSettings({ ...settings, dateFormat: e.target.value })}
          >
            {DATE_FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center mt-2 space-x-4">
            <input 
              type="color" 
              id="primaryColor" 
              value={settings.primaryColor} 
              onChange={(e) => updateSettings({ ...settings, primaryColor: e.target.value })}
              className="w-10 h-10 p-1 rounded border border-gray-300"
            />
            <Input 
              value={settings.primaryColor}
              onChange={(e) => updateSettings({ ...settings, primaryColor: e.target.value })}
              className="w-32"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSettings({ ...settings, primaryColor: '#3B82F6' })}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SecuritySettings = ({ settings, updateSettings }) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Security & Backup</CardTitle>
        <CardDescription>
          Manage security settings and data backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
          <div className="flex items-center space-x-2 mt-2">
            <input 
              type="checkbox" 
              id="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onChange={(e) => updateSettings({ ...settings, twoFactorAuth: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="twoFactorAuth" className="text-sm">Require two-factor authentication for all staff accounts</label>
          </div>
        </div>
        
        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          <Input 
            id="sessionTimeout" 
            type="number"
            min="5"
            max="1440"
            value={settings.sessionTimeout} 
            onChange={(e) => updateSettings({ ...settings, sessionTimeout: e.target.value })} 
          />
          <p className="text-xs text-gray-500 mt-1">Automatically log out after period of inactivity</p>
        </div>
        
        <div>
          <Label htmlFor="backupFrequency">Automatic Backup Frequency</Label>
          <select
            id="backupFrequency"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={settings.backupFrequency}
            onChange={(e) => updateSettings({ ...settings, backupFrequency: e.target.value })}
          >
            {BACKUP_FREQUENCY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between pt-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExportDialog(true)}
          >
            <Database className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
        </div>
      </CardContent>
      
      {/* Export Data Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Download a backup of your gym management data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select data to export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="export_members" className="rounded" defaultChecked />
                  <label htmlFor="export_members" className="text-sm">Members</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="export_attendance" className="rounded" defaultChecked />
                  <label htmlFor="export_attendance" className="text-sm">Attendance</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="export_payments" className="rounded" defaultChecked />
                  <label htmlFor="export_payments" className="text-sm">Payments</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="export_classes" className="rounded" defaultChecked />
                  <label htmlFor="export_classes" className="text-sm">Classes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="export_settings" className="rounded" defaultChecked />
                  <label htmlFor="export_settings" className="text-sm">Settings</label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="format_json" name="format" defaultChecked className="rounded" />
                  <label htmlFor="format_json" className="text-sm">JSON</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="format_csv" name="format" className="rounded" />
                  <label htmlFor="format_csv" className="text-sm">CSV</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Import Data Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Import data from a backup file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Import Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="import_merge" name="import_mode" defaultChecked className="rounded" />
                  <label htmlFor="import_merge" className="text-sm">Merge with existing data</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="import_replace" name="import_mode" className="rounded" />
                  <label htmlFor="import_replace" className="text-sm">Replace existing data</label>
                </div>
              </div>
              <p className="text-xs text-red-500 mt-1">Warning: Replacing existing data will delete all current data.</p>
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex justify-center">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
              <Button disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const Settings = () => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangesSaved, setIsChangesSaved] = useState(false);
  
  // Default settings data
  const [settings, setSettings] = useState({
    gymName: 'Fitness Pro Gym',
    phone: '(123) 456-7890',
    email: 'info@fitnessprogym.com',
    address: '123 Fitness Street',
    city: 'Gymville',
    state: 'CA',
    zipCode: '90210',
    country: 'United States',
    website: 'www.fitnessprogym.com',
    logo: '',
    currency: 'USD',
    taxRate: 8.5,
    paymentMethods: ['credit_card', 'cash', 'bank_transfer'],
    membershipTypes: [
      { type: 'monthly', price: 49.99, duration: 30 },
      { type: 'quarterly', price: 129.99, duration: 90 },
      { type: 'annual', price: 499.99, duration: 365 },
      { type: 'day_pass', price: 15, duration: 1 }
    ],
    emailNotifications: {
      newMember: true,
      payment: true,
      paymentFailed: true,
      membershipExpiring: true
    },
    systemNotifications: {
      newMember: true,
      payment: true,
      checkin: false,
      capacity: true
    },
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    primaryColor: '#3B82F6',
    twoFactorAuth: false,
    sessionTimeout: 30,
    backupFrequency: 'daily'
  });
  
  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, you would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      
      addNotification({
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully.',
        type: 'success'
      });
      
      setIsChangesSaved(true);
      setTimeout(() => setIsChangesSaved(false), 3000); // Hide checkmark after 3 seconds
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to save settings. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    setIsChangesSaved(false);
  };
  
  const sections = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'business', label: 'Business', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'security', label: 'Security', icon: Shield },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your gym management system settings</p>
        </div>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving || isChangesSaved}
          className="relative"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : isChangesSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm">
            <nav className="space-y-1 p-3">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon className={`h-5 w-5 mr-3 ${
                    activeSection === section.id ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  {section.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {activeSection === 'general' && <GeneralSettings settings={settings} updateSettings={updateSettings} />}
          {activeSection === 'business' && <BusinessSettings settings={settings} updateSettings={updateSettings} />}
          {activeSection === 'notifications' && <NotificationSettings settings={settings} updateSettings={updateSettings} />}
          {activeSection === 'appearance' && <AppearanceSettings settings={settings} updateSettings={updateSettings} />}
          {activeSection === 'security' && <SecuritySettings settings={settings} updateSettings={updateSettings} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;