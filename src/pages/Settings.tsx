import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { supabase } from "../lib/supabase";
import { useNotifications } from "../context/NotificationContext";
import {
  MembershipType,
  fetchMembershipTypes,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
  createDefaultMembershipTypes,
} from "../services/membershipService";
import { migrateMembershipTypes } from "../utils/migrateMembershipTypes";
// import { useAuth } from "../context/AuthContext";

const CURRENCY_OPTIONS = [
  { value: "MAD", label: "MAD - Dirham Marocain (DH)" },
  { value: "EUR", label: "EUR - Euro (€)" },
  { value: "GBP", label: "GBP - Livre Sterling (£)" },
  { value: "USD", label: "USD - Dollar Américain ($)" },
  { value: "CAD", label: "CAD - Dollar Canadien (C$)" },
  { value: "AUD", label: "AUD - Dollar Australien (A$)" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "Anglais (English)" },
  { value: "es", label: "Espagnol (Español)" },
  { value: "fr", label: "Français (French)" },
  { value: "de", label: "Allemand (Deutsch)" },
  { value: "it", label: "Italien (Italiano)" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC - Coordinated Universal Time" },
  { value: "America/New_York", label: "EST - Eastern Standard Time (UTC-5)" },
  { value: "America/Chicago", label: "CST - Central Standard Time (UTC-6)" },
  { value: "America/Denver", label: "MST - Mountain Standard Time (UTC-7)" },
  {
    value: "America/Los_Angeles",
    label: "PST - Pacific Standard Time (UTC-8)",
  },
  { value: "Europe/London", label: "GMT - Greenwich Mean Time (UTC+0)" },
  { value: "Europe/Paris", label: "CET - Central European Time (UTC+1)" },
  { value: "Asia/Tokyo", label: "JST - Japan Standard Time (UTC+9)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

// Backup frequency options commented out as they're not used
// const BACKUP_FREQUENCY_OPTIONS = [
//   { value: "daily", label: "Quotidien" },
//   { value: "weekly", label: "Hebdomadaire" },
//   { value: "monthly", label: "Mensuel" },
// ];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "annual", label: "Annuel" },
  { value: "day_pass", label: "Accès Journalier" },
];

const GeneralSettings = ({
  settings,
  updateSettings,
}: SettingsComponentProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Informations de la Salle</CardTitle>
        <CardDescription>
          Informations de base sur votre salle de sport
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="gym_name">Nom de la Salle</Label>
          <Input
            id="gym_name"
            placeholder="Entrez le nom de votre salle"
            value={settings.gymName}
            onChange={(e) =>
              updateSettings.updateValue({
                ...settings,
                gymName: e.target.value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Numéro de Téléphone</Label>
            <Input
              id="phone"
              placeholder="Entrez votre numéro de téléphone"
              value={settings.phone}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  phone: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="email">Email Professionnel</Label>
            <Input
              id="email"
              type="email"
              placeholder="Entrez votre email professionnel"
              value={settings.email}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  email: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            placeholder="Entrez l'adresse de votre salle"
            value={settings.address}
            onChange={(e) =>
              updateSettings.updateValue({
                ...settings,
                address: e.target.value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              placeholder="Entrez la ville"
              value={settings.city}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  city: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="state">État/Province</Label>
            <Input
              id="state"
              placeholder="Entrez l'état ou la province"
              value={settings.state}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  state: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipcode">Code Postal</Label>
            <Input
              id="zipcode"
              placeholder="Entrez le code postal"
              value={settings.zipCode}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  zipCode: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              placeholder="Entrez le pays"
              value={settings.country}
              onChange={(e) =>
                updateSettings.updateValue({
                  ...settings,
                  country: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Site Web</Label>
          <Input
            id="website"
            placeholder="Entrez l'URL de votre site web"
            value={settings.website}
            onChange={(e) =>
              updateSettings.updateValue({
                ...settings,
                website: e.target.value,
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center space-x-4 mt-2">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo de la Salle"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Building className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => updateSettings.handleLogoUpload(e)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Télécharger Logo
              </Button>
              {settings.logo && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 font-bold text-xl p-2 rounded-full hover:bg-red-50 focus:outline-none mt-2"
                  onClick={() => updateSettings.handleLogoRemove()}
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import MembershipTypesManager from "../components/settings/MembershipTypesManager";
import StaffPermissionsManager from "../components/settings/StaffPermissionsManager";

const BusinessSettings = ({
  settings,
  updateSettings,
  membershipTypes,
  onMembershipTypesChange,
  isLoadingMembershipTypes,
}: SettingsComponentProps) => {
  const { addNotification } = useNotifications();
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrateMembershipTypes = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateMembershipTypes();

      if (result.success) {
        addNotification({
          title: "Migration réussie",
          message: result.message,
          type: "success",
        });
      } else {
        addNotification({
          title: "Échec de la migration",
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error during migration:", error);
      addNotification({
        title: "Erreur",
        message: "Une erreur s'est produite lors de la migration",
        type: "error",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle> Paiements</CardTitle>
          <CardDescription>
            Configurer les paramètres de paiement et financiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Méthodes de Paiement</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payment_credit"
                  checked={settings.paymentMethods.includes("credit_card")}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...settings.paymentMethods, "credit_card"]
                      : settings.paymentMethods.filter(
                          (m) => m !== "credit_card"
                        );
                    updateSettings.updateValue({
                      ...settings,
                      paymentMethods: newMethods,
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="payment_credit" className="text-sm">
                  Carte de Crédit
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payment_cash"
                  checked={settings.paymentMethods.includes("cash")}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...settings.paymentMethods, "cash"]
                      : settings.paymentMethods.filter((m) => m !== "cash");
                    updateSettings.updateValue({
                      ...settings,
                      paymentMethods: newMethods,
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="payment_cash" className="text-sm">
                  Espèces
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payment_bank"
                  checked={settings.paymentMethods.includes("bank_transfer")}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...settings.paymentMethods, "bank_transfer"]
                      : settings.paymentMethods.filter(
                          (m) => m !== "bank_transfer"
                        );
                    updateSettings.updateValue({
                      ...settings,
                      paymentMethods: newMethods,
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="payment_bank" className="text-sm">
                  Virement Bancaire
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Membership Types are now managed in a separate component */}
      {membershipTypes && onMembershipTypesChange && (
        <>
          <MembershipTypesManager
            membershipTypes={membershipTypes}
            onMembershipTypesChange={onMembershipTypesChange}
            isLoading={isLoadingMembershipTypes}
          />

          {/**
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Maintenance des Types d'Abonnement</CardTitle>
              <CardDescription>
                Outils pour mettre à jour les types d'abonnement des membres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Si vous avez des membres avec d'anciens types d'abonnement (basic, premium, platinum),
                    utilisez cet outil pour les migrer vers les nouveaux types (mensuel, trimestriel, annuel).
                  </p>
                  <Button
                    onClick={handleMigrateMembershipTypes}
                    disabled={isMigrating}
                    className="w-full"
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Migration en cours...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Migrer les Anciens Types d'Abonnement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>*/}
        </>
      )}
    </div>
  );
};

const NotificationSettings = ({
  settings,
  updateSettings,
}: SettingsComponentProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configurer quand et comment vous recevez des notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base">Notifications par Email</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_new_member"
                  checked={settings.emailNotifications.newMember}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        newMember: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_new_member" className="text-sm">
                  Inscription d'un nouveau membre
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_payment"
                  checked={settings.emailNotifications.payment}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        payment: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_payment" className="text-sm">
                  Paiement reçu
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_payment_failed"
                  checked={settings.emailNotifications.paymentFailed}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        paymentFailed: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_payment_failed" className="text-sm">
                  Échec de paiement
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_membership_expiring"
                  checked={settings.emailNotifications.membershipExpiring}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        membershipExpiring: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="email_membership_expiring" className="text-sm">
                  Abonnement expirant
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base">Notifications Système</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="system_new_member"
                  checked={settings.systemNotifications.newMember}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        newMember: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_new_member" className="text-sm">
                  Inscription d'un nouveau membre
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="system_payment"
                  checked={settings.systemNotifications.payment}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        payment: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_payment" className="text-sm">
                  Paiement reçu
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="system_checkin"
                  checked={settings.systemNotifications.checkin}
                  onChange={(e) => {
                    updateSettings.updateValue({
                      ...settings,
                      systemNotifications: {
                        ...settings.systemNotifications,
                        checkin: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_checkin" className="text-sm">
                  Entrée d'un membre
                </label>
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
                        capacity: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <label htmlFor="system_capacity" className="text-sm">
                  Capacité du cours atteinte
                </label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Appearance Settings component commented out for future implementation
/*
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
*/

// MembershipType interface moved to src/services/membershipService.ts

interface EmailNotifications {
  newMember: boolean;
  payment: boolean;
  paymentFailed: boolean;
  membershipExpiring: boolean;
}

interface SystemNotifications {
  newMember: boolean;
  payment: boolean;
  checkin: boolean;
  capacity: boolean;
}

interface SettingsData {
  gymName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  logo: string;
  currency: string;
  taxRate: number;
  paymentMethods: string[];
  // membershipTypes removed - now managed in a separate table
  emailNotifications: EmailNotifications;
  systemNotifications: SystemNotifications;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  primaryColor: string;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  autoCheckoutMinutes: number;
  autoCheckoutEnabled: boolean;
  backupFrequency?: string; // Made optional since it doesn't exist in the database
}

interface SettingsComponentProps {
  settings: SettingsData;
  updateSettings: {
    updateValue: (newSettings: SettingsData) => void;
    handleLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleLogoRemove?: () => void;
  };
  membershipTypes?: MembershipType[];
  onMembershipTypesChange?: (types: MembershipType[]) => void;
  isLoadingMembershipTypes?: boolean;
}

const SecuritySettings = ({
  settings,
  updateSettings,
}: SettingsComponentProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Présence & Sauvegarde</CardTitle>
        <CardDescription>
          Gérer les paramètres de présence et la sauvegarde des données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoCheckoutEnabled"
              className="rounded"
              checked={settings.autoCheckoutEnabled}
              onChange={(e) => {
                console.log("Checkbox changed to:", e.target.checked);
                updateSettings.updateValue({
                  ...settings,
                  autoCheckoutEnabled: e.target.checked,
                });
              }}
            />
            <Label htmlFor="autoCheckoutEnabled" className="font-medium">
              Activer le départ automatique
            </Label>
          </div>

          <div>
            <Label htmlFor="autoCheckoutMinutes">
              Départ Automatique (minutes)
            </Label>
            <Input
              id="autoCheckoutMinutes"
              type="number"
              min="5"
              max="1440"
              value={settings.autoCheckoutMinutes}
              disabled={!settings.autoCheckoutEnabled}
              className={!settings.autoCheckoutEnabled ? "bg-gray-100 text-gray-500" : ""}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                updateSettings.updateValue({
                  ...settings,
                  autoCheckoutMinutes: isNaN(value) ? 240 : value,
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Temps après lequel un membre est automatiquement enregistré comme
              parti (minimum: 5 minutes, par défaut: 240 minutes = 4 heures)
            </p>
          </div>
        </div>

      
      </CardContent>

      {/* Export Data Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter les Données</DialogTitle>
            <DialogDescription>
              Télécharger une sauvegarde de vos données de gestion de salle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sélectionner les données à exporter</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export_members"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="export_members" className="text-sm">
                    Membres
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export_attendance"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="export_attendance" className="text-sm">
                    Présences
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export_payments"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="export_payments" className="text-sm">
                    Paiements
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export_classes"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="export_classes" className="text-sm">
                    Cours
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export_settings"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="export_settings" className="text-sm">
                    Paramètres
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="format_json"
                    name="format"
                    defaultChecked
                    className="rounded"
                  />
                  <label htmlFor="format_json" className="text-sm">
                    JSON
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="format_csv"
                    name="format"
                    className="rounded"
                  />
                  <label htmlFor="format_csv" className="text-sm">
                    CSV
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
              >
                Annuler
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des Données</DialogTitle>
            <DialogDescription>
              Importer des données à partir d'un fichier de sauvegarde
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Options d'Importation</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="import_merge"
                    name="import_mode"
                    defaultChecked
                    className="rounded"
                  />
                  <label htmlFor="import_merge" className="text-sm">
                    Fusionner avec les données existantes
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="import_replace"
                    name="import_mode"
                    className="rounded"
                  />
                  <label htmlFor="import_replace" className="text-sm">
                    Remplacer les données existantes
                  </label>
                </div>
              </div>
              <p className="text-xs text-red-500 mt-1">
                Attention: Le remplacement des données existantes supprimera
                toutes les données actuelles.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Télécharger un Fichier</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex justify-center">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner un Fichier
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
              >
                Annuler
              </Button>
              <Button disabled>
                <Upload className="h-4 w-4 mr-2" />
                Importer
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
  // const { user } = useAuth(); // Uncomment if user info is needed
  const [activeSection, setActiveSection] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangesSaved, setIsChangesSaved] = useState(false);

  // State for membership types
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isLoadingMembershipTypes, setIsLoadingMembershipTypes] =
    useState(true);

  // Default settings data
  const [settings, setSettings] = useState<SettingsData>({
    gymName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    logo: "",
    currency: "MAD",
    taxRate: 0,
    paymentMethods: ["credit_card", "cash", "bank_transfer"],
    // membershipTypes removed - now managed in a separate table
    emailNotifications: {
      newMember: true,
      payment: true,
      paymentFailed: true,
      membershipExpiring: true,
    },
    systemNotifications: {
      newMember: true,
      payment: true,
      checkin: false,
      capacity: true,
    },
    theme: "light",
    language: "fr",
    timezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
    primaryColor: "#3B82F6",
    twoFactorAuth: false,
    sessionTimeout: 30,
    autoCheckoutMinutes: 240, // 4 hours in minutes
    autoCheckoutEnabled: true, // Auto-checkout enabled by default
    backupFrequency: "daily",
  });

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Check if the file is an image
      if (!file.type.startsWith("image/")) {
        addNotification({
          title: "Type de fichier invalide",
          message: "Veuillez télécharger une image (JPG, PNG, etc.)",
          type: "error",
        });
        return;
      }

      // Check if the file size is less than 2MB
      if (file.size > 2 * 1024 * 1024) {
        addNotification({
          title: "Fichier trop volumineux",
          message: "La taille du logo ne doit pas dépasser 2MB",
          type: "error",
        });
        return;
      }

      // Create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.getBucket(
        "gym-logos"
      );

      if (bucketError && bucketError.message.includes("not found")) {
        await supabase.storage.createBucket("gym-logos", {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
          ],
        });
      } else if (bucketError) {
        throw bucketError;
      }

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("gym-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("gym-logos")
        .getPublicUrl(fileName);

      if (urlData) {
        // Update the settings with the new logo URL
        setSettings({ ...settings, logo: urlData.publicUrl });

        addNotification({
          title: "Logo téléchargé",
          message: "Le logo a été téléchargé avec succès",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      addNotification({
        title: "Erreur",
        message: "Échec du téléchargement du logo. Veuillez réessayer.",
        type: "error",
      });
    }
  };

  // Handle logo removal
  const handleLogoRemove = async () => {
    try {
      if (!settings.logo) return;

      // Extract the file name from the URL
      const fileName = settings.logo.split("/").pop();

      if (fileName) {
        // Delete the file from storage
        const { error: deleteError } = await supabase.storage
          .from("gym-logos")
          .remove([fileName]);

        if (deleteError) throw deleteError;
      }

      // Update the settings
      setSettings({ ...settings, logo: "" });

      addNotification({
        title: "Logo supprimé",
        message: "Le logo a été supprimé avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la suppression du logo. Veuillez réessayer.",
        type: "error",
      });
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save settings to gym_settings table
      const { data: gymSettingsData, error: fetchError } = await supabase
        .from("gym_settings")
        .select("id")
        .limit(1);

      if (fetchError) throw fetchError;

      // Log the settings data to help debug
      console.log("Fetching gym settings data:", gymSettingsData);
      console.log("Current settings state:", settings);

      // Prepare the settings data to save - only include fields that exist in the database
      // First, let's check which fields actually exist in the database
      const { data: dbColumns, error: columnsError } = await supabase
        .from("gym_settings")
        .select("*")
        .limit(1);

      if (columnsError) {
        console.error("Error fetching database columns:", columnsError);
        throw columnsError;
      }

      // Log the current database state
      console.log("Current database state:", dbColumns && dbColumns.length > 0 ? dbColumns[0] : "No data");

      // Get the column names from the first row
      const columnNames =
        dbColumns && dbColumns.length > 0 ? Object.keys(dbColumns[0]) : [];

      console.log("Available columns in gym_settings:", columnNames);

      // Create a settings object with only the fields that exist in the database
      const settingsData: Record<string, unknown> = {};

      // Map our settings fields to database column names with their values
      const fieldMappings: Record<string, { column: string; value: unknown }> =
        {
          autoCheckoutMinutes: {
            column: "auto_checkout_minutes",
            value: settings.autoCheckoutMinutes,
          },
          autoCheckoutEnabled: {
            column: "auto_checkout_enabled",
            value: settings.autoCheckoutEnabled,
          },
          gymName: { column: "gym_name", value: settings.gymName },
          phone: { column: "phone", value: settings.phone },
          email: { column: "email", value: settings.email },
          address: { column: "address", value: settings.address },
          city: { column: "city", value: settings.city },
          state: { column: "state", value: settings.state },
          zipCode: { column: "zip_code", value: settings.zipCode },
          country: { column: "country", value: settings.country },
          website: { column: "website", value: settings.website },
          logo: { column: "logo_url", value: settings.logo },
          paymentMethods: {
            column: "payment_methods",
            value: settings.paymentMethods,
          },
          emailNotifications: {
            column: "email_notifications",
            value: settings.emailNotifications,
          },
          systemNotifications: {
            column: "system_notifications",
            value: settings.systemNotifications,
          },
          language: { column: "language", value: settings.language },
          dateFormat: { column: "date_format", value: settings.dateFormat },
          timezone: { column: "timezone", value: settings.timezone },
        };

      // Only include fields that exist in the database
      Object.values(fieldMappings).forEach((mapping) => {
        if (columnNames.includes(mapping.column)) {
          // Special handling for boolean values to ensure they're properly saved
          if (mapping.column === 'auto_checkout_enabled') {
            // Explicitly convert to boolean to avoid any type issues
            settingsData[mapping.column] = mapping.value === true;
            console.log(`Setting ${mapping.column} to explicit boolean:`, settingsData[mapping.column]);
          } else {
            settingsData[mapping.column] = mapping.value;
          }
        }
      });

      console.log("Settings data to save:", settingsData);
      console.log("Auto-checkout enabled value:", settingsData.auto_checkout_enabled);

      if (gymSettingsData && gymSettingsData.length > 0) {
        console.log("About to update settings with:", settingsData);
        console.log("Auto-checkout enabled value before update:", settingsData.auto_checkout_enabled);

        // Create a new object with explicit boolean value for auto_checkout_enabled
        const dataToUpdate = {
          ...settingsData,
          auto_checkout_enabled: settingsData.auto_checkout_enabled === true
        };

        console.log("Final data to update:", dataToUpdate);

        // Try a direct REST API call to update the settings
        try {
          // First, check if the user is an admin
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("role")
            .eq("id", supabase.auth.getUser().then(res => res.data.user?.id));

          if (staffError) {
            console.error("Error checking staff role:", staffError);
          }

          console.log("Staff data:", staffData);

          // Update existing settings
          const { error: updateError } = await supabase
            .from("gym_settings")
            .update(dataToUpdate)
            .eq("id", gymSettingsData[0].id);

          if (updateError) {
            console.error("Error updating settings:", updateError);
            throw updateError;
          }

          // Use a direct SQL query to update just the auto_checkout_enabled field
          // This is a workaround for the RLS policy issue
          const { data: directData, error: directError } = await supabase
            .rpc('update_auto_checkout_enabled', {
              enabled: settings.autoCheckoutEnabled === true,
              settings_id: gymSettingsData[0].id
            });

          // Force the local state to match what we're trying to save
          setSettings(prevSettings => ({
            ...prevSettings,
            autoCheckoutEnabled: settings.autoCheckoutEnabled === true
          }));

          if (directError) {
            console.error("Error with direct update:", directError);
          } else {
            console.log("Direct update result:", directData);
          }
        } catch (error) {
          console.error("Error in update process:", error);
          throw error;
        }

        console.log("Update completed successfully");

        // Explicitly fetch the updated settings to ensure we have the latest values
        const { data: updatedSettings, error: fetchSettingsError } = await supabase
          .from("gym_settings")
          .select("*")
          .eq("id", gymSettingsData[0].id)
          .limit(1);

        if (fetchSettingsError) {
          console.error("Error fetching updated settings:", fetchSettingsError);
          throw fetchSettingsError;
        }

        // Log the fetched data from the database
        console.log("Fetched settings after update:", updatedSettings);
        console.log("Auto-checkout enabled value after update:", updatedSettings && updatedSettings.length > 0 ? updatedSettings[0].auto_checkout_enabled : "Unknown");

        // Update the local settings state with the values from the database
        if (updatedSettings && updatedSettings.length > 0) {
          const dbSettings = updatedSettings[0];
          console.log("Setting autoCheckoutEnabled to:", dbSettings.auto_checkout_enabled);

          // Force the settings update to match what's in the database
          // Use strict equality check for boolean values
          const isEnabled = dbSettings.auto_checkout_enabled === true;
          console.log("Setting autoCheckoutEnabled state to:", isEnabled);

          setSettings(prevSettings => {
            const newSettings = {
              ...prevSettings,
              autoCheckoutEnabled: isEnabled,
              autoCheckoutMinutes: dbSettings.auto_checkout_minutes || 240
            };
            console.log("New settings state:", newSettings);
            return newSettings;
          });
        }
      } else {
        // Insert new settings if none exist
        const { error: insertError } = await supabase
          .from("gym_settings")
          .insert([settingsData]);

        if (insertError) throw insertError;

        // Explicitly fetch the inserted settings
        const { data: insertedSettings, error: fetchInsertError } = await supabase
          .from("gym_settings")
          .select("*")
          .limit(1);

        if (fetchInsertError) throw fetchInsertError;

        // Log the fetched data from the database
        console.log("Fetched settings after insert:", insertedSettings);

        // Update the local settings state with the values from the database
        if (insertedSettings && insertedSettings.length > 0) {
          const dbSettings = insertedSettings[0];
          console.log("Setting autoCheckoutEnabled to:", dbSettings.auto_checkout_enabled);

          // Force the settings update to match what's in the database
          // Use strict equality check for boolean values
          const isEnabled = dbSettings.auto_checkout_enabled === true;
          console.log("Setting autoCheckoutEnabled state to:", isEnabled);

          setSettings(prevSettings => {
            const newSettings = {
              ...prevSettings,
              autoCheckoutEnabled: isEnabled,
              autoCheckoutMinutes: dbSettings.auto_checkout_minutes || 240
            };
            console.log("New settings state:", newSettings);
            return newSettings;
          });
        }
      }

      // Save membership types
      // First, identify which types need to be created, updated, or deleted
      const existingTypes = membershipTypes.filter(
        (type) => type.id && type.id > 0
      );
      const newTypes = membershipTypes.filter(
        (type) => !type.id || type.id < 0
      );

      // Get the current types from the database to identify deleted ones
      const { data: currentTypes } = await supabase
        .from("membership_types")
        .select("id");

      const currentTypeIds = currentTypes?.map((t) => t.id) || [];
      const existingTypeIds = existingTypes.map((t) => t.id);

      // Find IDs that exist in the database but not in our current state (these need to be deleted)
      const deletedTypeIds = currentTypeIds.filter(
        (id) => !existingTypeIds.includes(id)
      );

      // Process updates
      for (const type of existingTypes) {
        if (type.id) {
          const { error } = await updateMembershipType(type.id, {
            type: type.type,
            price: type.price,
            duration: type.duration,
          });

          if (error) {
            console.error("Error updating membership type:", error);
            throw error;
          }
        }
      }

      // Process creations
      for (const type of newTypes) {
        const { error } = await createMembershipType({
          type: type.type,
          price: type.price,
          duration: type.duration,
        });

        if (error) {
          console.error("Error creating membership type:", error);
          throw error;
        }
      }

      // Process deletions
      for (const id of deletedTypeIds) {
        const { error } = await deleteMembershipType(id);

        if (error) {
          console.error("Error deleting membership type:", error);
          throw error;
        }
      }

      // Show success notification
      addNotification({
        title: "Paramètres Enregistrés",
        message: "Vos paramètres ont été enregistrés avec succès.",
        type: "success",
        duration: 5000, // Show for 5 seconds
      });

      setIsChangesSaved(true);
      setTimeout(() => setIsChangesSaved(false), 3000); // Hide checkmark after 3 seconds

      // Refresh membership types from the database to get the updated list with proper IDs
      const { data: refreshedTypes } = await supabase
        .from("membership_types")
        .select("*")
        .order("id", { ascending: true });

      if (refreshedTypes) {
        setMembershipTypes(refreshedTypes);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      addNotification({
        title: "Erreur",
        message:
          "Échec de l'enregistrement des paramètres. Veuillez réessayer.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettingsObject = {
    handleLogoUpload,
    handleLogoRemove,
    updateValue: (newSettings) => {
      setSettings(newSettings);
      setIsChangesSaved(false);
    },
  };

  // Fetch settings and membership types from database on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch gym settings
        const { data: gymSettingsData, error: settingsError } = await supabase
          .from("gym_settings")
          .select("*")
          .limit(1);

        if (settingsError) throw settingsError;

        if (gymSettingsData && gymSettingsData.length > 0) {
          const dbSettings = gymSettingsData[0];

          // Log the database settings to help debug
          console.log("Database settings:", dbSettings);

          // Update settings state with database values
          setSettings((prevSettings) => ({
            ...prevSettings,
            autoCheckoutMinutes: dbSettings.auto_checkout_minutes || 240,
            autoCheckoutEnabled: dbSettings.auto_checkout_enabled === true,
            gymName: dbSettings.gym_name || "",
            phone: dbSettings.phone || "",
            email: dbSettings.email || "",
            // Keep the default values for address fields since they might not exist in the database
            // address: dbSettings.address || "",
            // city: dbSettings.city || "",
            // state: dbSettings.state || "",
            // zipCode: dbSettings.zip_code || "",
            // country: dbSettings.country || "",
            website: dbSettings.website || "",
            logo: dbSettings.logo_url || "",
            currency: "MAD", // Default value since it doesn't exist in the database
            // taxRate: dbSettings.tax_rate || 0,
            paymentMethods: dbSettings.payment_methods || [
              "credit_card",
              "cash",
              "bank_transfer",
            ],
            // membershipTypes removed - now managed in a separate table
            emailNotifications: dbSettings.email_notifications || {
              newMember: true,
              payment: true,
              paymentFailed: true,
              membershipExpiring: true,
            },
            systemNotifications: dbSettings.system_notifications || {
              newMember: true,
              payment: true,
              checkin: false,
              capacity: true,
            },
            // backupFrequency: dbSettings.backup_frequency || "daily", // Removed as it doesn't exist in the database
            language: dbSettings.language || "fr",
            dateFormat: dbSettings.date_format || "DD/MM/YYYY",
            timezone: dbSettings.timezone || "Europe/Paris",
          }));
        }

        // Fetch membership types
        setIsLoadingMembershipTypes(true);
        try {
          // Try to fetch existing membership types
          const types = await fetchMembershipTypes();

          // If no types exist, create default ones
          if (types.length === 0) {
            const defaultTypes = await createDefaultMembershipTypes();
            setMembershipTypes(defaultTypes);
          } else {
            setMembershipTypes(types);
          }
        } catch (error) {
          console.error("Error loading membership types:", error);
          addNotification({
            title: "Erreur",
            message: "Échec du chargement des types d'abonnement.",
            type: "error",
          });
        } finally {
          setIsLoadingMembershipTypes(false);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        addNotification({
          title: "Erreur",
          message:
            "Échec du chargement des paramètres. Veuillez rafraîchir la page.",
          type: "error",
        });
      }
    };

    fetchData();
  }, [addNotification]);

  const sections = [
    { id: "general", label: "Général", icon: Building },
    { id: "business", label: "Abonnements", icon: CreditCard },
    { id: "staff", label: "Permissions Personnel", icon: Shield },
    // { id: "notifications", label: "Notifications", icon: Bell },
    // Appearance section commented out for future implementation
    // { id: "appearance", label: "Apparence", icon: Sun },
    { id: "security", label: "Présence", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérer les paramètres de votre système de gestion de salle
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || isChangesSaved}
          className="relative"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enregistrement...
            </>
          ) : isChangesSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm">
            <nav className="space-y-1 p-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 ${
                    activeSection === section.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon
                    className={`h-5 w-5 mr-3 text-gray-400 ${
                      activeSection === section.id
                        ? "text-gray-500"
                        : ""
                    }`}
                  />
                  {section.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeSection === "general" && (
            <GeneralSettings
              settings={settings}
              updateSettings={updateSettingsObject}
            />
          )}
          {activeSection === "business" && (
            <BusinessSettings
              settings={settings}
              updateSettings={{
                updateValue: updateSettingsObject.updateValue,
              }}
              membershipTypes={membershipTypes}
              onMembershipTypesChange={setMembershipTypes}
              isLoadingMembershipTypes={isLoadingMembershipTypes}
            />
          )}
          {activeSection === "staff" && (
            <StaffPermissionsManager />
          )}
          {activeSection === "notifications" && (
            <NotificationSettings
              settings={settings}
              updateSettings={{
                updateValue: updateSettingsObject.updateValue,
              }}
            />
          )}
          {/* Appearance section commented out for future implementation
          {activeSection === "appearance" && (
            <AppearanceSettings
              settings={settings}
              updateSettings={{
                updateValue: updateSettingsObject.updateValue
              }}
            />
          )}
          */}
          {activeSection === "security" && (
            <SecuritySettings
              settings={settings}
              updateSettings={{
                updateValue: updateSettingsObject.updateValue,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
