import React, { useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Users,
  CreditCard,
  Calendar,
  Dumbbell,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  exportData,
  ExportFormat,
  ExportDataType,
} from "../lib/utils/exportData";
import {
  importData,
  ImportDataType,
  ImportMode,
} from "../lib/utils/importData";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const DataImportExport: React.FC = () => {
  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [exportDataType, setExportDataType] =
    useState<ExportDataType>("members");
  const [exportDateRange, setExportDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDataType, setImportDataType] =
    useState<ImportDataType>("members");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);

      await exportData({
        format: exportFormat,
        dataType: exportDataType,
        dateRange:
          exportDataType === "members" || exportDataType === "classes"
            ? undefined
            : exportDateRange,
        fileName: `gympro_export_${exportDataType}_${
          new Date().toISOString().split("T")[0]
        }`,
      });

      setIsExporting(false);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      // Show error notification
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      setImportProgress(0);

      const result = await importData({
        file: importFile,
        dataType: importDataType,
        mode: importMode,
        onProgress: (progress) => setImportProgress(progress),
        onComplete: (result) => {
          setImportResult(result);
          setShowImportResult(true);
          setIsImporting(false);
          setImportProgress(100);
        },
        onError: (error) => {
          console.error("Import error:", error);
          setImportResult({
            success: false,
            errors: [error.message],
            totalRecords: 0,
            importedRecords: 0,
            skippedRecords: 0,
          });
          setShowImportResult(true);
          setIsImporting(false);
        },
      });
    } catch (error) {
      console.error("Import error:", error);
      setIsImporting(false);
      // Show error notification
    }
  };

  // Get data type icon
  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case "members":
        return <Users className="h-5 w-5" />;
      case "payments":
        return <CreditCard className="h-5 w-5" />;
      case "attendance":
        return <Calendar className="h-5 w-5" />;
      case "classes":
        return <Dumbbell className="h-5 w-5" />;
      default:
        return <FileSpreadsheet className="h-5 w-5" />;
    }
  };

  // Download sample file for import
  const downloadSampleFile = (dataType: ImportDataType) => {
    let content = "";
    let fileName = "";
    let mimeType = "text/csv;charset=utf-8;";

    switch (dataType) {
      case "members":
        fileName = "exemple_membres.csv";
        content = `FirstName,LastName,Email,Phone,MembershipType,StartDate,Status,Notes
Jean,Dupont,jean.dupont@example.com,(123) 456-7890,monthly,2023-01-15,active,Client régulier
Marie,Martin,marie.martin@example.com,(123) 456-7891,quarterly,2023-02-20,active,Préfère les cours du matin
Pierre,Bernard,pierre.bernard@example.com,(123) 456-7892,annual,2023-03-10,active,Intéressé par le coaching personnel`;
        break;

      case "payments":
        fileName = "exemple_paiements.csv";
        content = `MemberID,Amount,PaymentDate,DueDate,Status,PaymentMethod,Notes
1,50.00,2023-03-15,2023-03-10,paid,card,Paiement mensuel
2,120.00,2023-03-20,2023-03-20,paid,cash,Paiement trimestriel
3,450.00,2023-03-25,2023-03-25,paid,transfer,Paiement annuel`;
        break;

      case "attendance":
        fileName = "exemple_frequentation.csv";
        content = `MemberID,CheckInTime,CheckOutTime,Type,Notes
1,2023-03-15T08:30:00,2023-03-15T10:15:00,regular,
2,2023-03-15T17:45:00,2023-03-15T19:30:00,class,Cours de yoga
3,2023-03-16T12:00:00,2023-03-16T13:30:00,regular,Séance courte`;
        break;

      case "classes":
        fileName = "exemple_cours.csv";
        content = `Name,Instructor,Capacity,Day,StartTime,EndTime,Description,Category,Difficulty,Location,IsActive
Yoga,Marie Dupont,20,monday,18:00,19:00,Cours de yoga pour tous,mind_body,all_levels,Salle 1,Yes
HIIT,Jean Martin,15,wednesday,19:30,20:30,Entraînement par intervalles de haute intensité,cardio,advanced,Salle 2,Yes
Pilates,Sophie Petit,12,friday,10:00,11:00,Renforcement musculaire doux,flexibility,beginner,Salle 1,Yes`;
        break;

      default:
        fileName = "exemple.csv";
        content = "Exemple non disponible pour ce type de données.";
    }

    // Create a blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Download documentation for data import
  const downloadDocumentation = (dataType: ImportDataType) => {
    let content = "";
    let fileName = "";

    switch (dataType) {
      case "members":
        fileName = "documentation_import_membres.md";
        content = `# Guide d'Importation des Membres

## Format des Données
Pour importer des membres dans le système, votre fichier doit contenir les colonnes suivantes:

### Colonnes Obligatoires
- **FirstName** - Prénom du membre
- **LastName** - Nom de famille du membre
- **Email** - Adresse email (doit être unique)
- **MembershipType** - Type d'abonnement (valeurs acceptées: "monthly", "quarterly", "annual", "daily")

### Colonnes Optionnelles
- **Phone** - Numéro de téléphone
- **StartDate** - Date de début d'abonnement (format YYYY-MM-DD)
- **Status** - Statut du membre (valeurs acceptées: "active", "inactive", "pending")
- **Notes** - Notes ou commentaires

## Exemple de Données
\`\`\`
FirstName,LastName,Email,Phone,MembershipType,StartDate,Status,Notes
Jean,Dupont,jean.dupont@example.com,(123) 456-7890,monthly,2023-01-15,active,Client régulier
Marie,Martin,marie.martin@example.com,(123) 456-7891,quarterly,2023-02-20,active,Préfère les cours du matin
\`\`\`

## Formats de Fichier Acceptés
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)

## Modes d'Importation
- **Fusionner**: Ajoute de nouveaux membres et met à jour les membres existants (basé sur l'email)
- **Remplacer**: Supprime tous les membres existants avant d'importer les nouveaux

## Conseils
- Assurez-vous que les emails sont uniques
- Vérifiez que les types d'abonnement correspondent aux valeurs acceptées
- Les dates doivent être au format YYYY-MM-DD
`;
        break;

      case "payments":
        fileName = "documentation_import_paiements.md";
        content = `# Guide d'Importation des Paiements

## Format des Données
Pour importer des paiements dans le système, votre fichier doit contenir les colonnes suivantes:

### Colonnes Obligatoires
- **MemberID** - ID du membre (doit exister dans le système)
- **Amount** - Montant du paiement (nombre décimal)
- **PaymentDate** - Date du paiement (format YYYY-MM-DD)
- **Status** - Statut du paiement (valeurs acceptées: "paid", "pending", "failed", "refunded")

### Colonnes Optionnelles
- **DueDate** - Date d'échéance (format YYYY-MM-DD)
- **PaymentMethod** - Méthode de paiement (valeurs acceptées: "cash", "card", "transfer", "check")
- **Notes** - Notes ou commentaires

## Exemple de Données
\`\`\`
MemberID,Amount,PaymentDate,DueDate,Status,PaymentMethod,Notes
1,50.00,2023-03-15,2023-03-10,paid,card,Paiement mensuel
2,120.00,2023-03-20,2023-03-20,paid,cash,Paiement trimestriel
\`\`\`

## Formats de Fichier Acceptés
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)

## Modes d'Importation
- **Fusionner**: Ajoute de nouveaux paiements sans affecter les existants
- **Remplacer**: Supprime tous les paiements existants avant d'importer les nouveaux

## Conseils
- Vérifiez que les IDs des membres existent dans le système
- Les montants doivent être des nombres décimaux (utilisez le point comme séparateur)
- Les dates doivent être au format YYYY-MM-DD
`;
        break;

      case "attendance":
        fileName = "documentation_import_frequentation.md";
        content = `# Guide d'Importation des Données de Fréquentation

## Format des Données
Pour importer des données de fréquentation dans le système, votre fichier doit contenir les colonnes suivantes:

### Colonnes Obligatoires
- **MemberID** - ID du membre (doit exister dans le système)
- **CheckInTime** - Date et heure d'entrée (format YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T08:30:00)

### Colonnes Optionnelles
- **CheckOutTime** - Date et heure de sortie (format YYYY-MM-DDThh:mm:ss, ex: 2023-03-15T10:15:00)
- **Type** - Type de visite (valeurs acceptées: "regular", "class", "trial", "guest")
- **Notes** - Notes ou commentaires

## Exemple de Données
\`\`\`
MemberID,CheckInTime,CheckOutTime,Type,Notes
1,2023-03-15T08:30:00,2023-03-15T10:15:00,regular,
2,2023-03-15T17:45:00,2023-03-15T19:30:00,class,Cours de yoga
\`\`\`

## Formats de Fichier Acceptés
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)

## Modes d'Importation
- **Fusionner**: Ajoute de nouvelles entrées sans affecter les existantes
- **Remplacer**: Supprime toutes les entrées existantes avant d'importer les nouvelles

## Conseils
- Vérifiez que les IDs des membres existent dans le système
- Les dates et heures doivent être au format YYYY-MM-DD HH:MM:SS
- L'heure de sortie peut être laissée vide si le membre n'est pas encore sorti
`;
        break;

      case "classes":
        fileName = "documentation_import_cours.md";
        content = `# Guide d'Importation des Cours

## Format des Données
Pour importer des cours dans le système, votre fichier doit contenir les colonnes suivantes:

### Colonnes Obligatoires
- **Name** - Nom du cours
- **Instructor** - Nom de l'instructeur
- **Capacity** - Capacité maximale (nombre entier)
- **Day** - Jour de la semaine (valeurs acceptées: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
- **StartTime** - Heure de début (format HH:MM)
- **EndTime** - Heure de fin (format HH:MM)

### Colonnes Optionnelles
- **Description** - Description du cours
- **Duration** - Durée en minutes (nombre entier)
- **Location** - Lieu du cours
- **Category** - Catégorie (valeurs acceptées: "strength", "cardio", "flexibility", "mind_body", "dance", "other")
- **Difficulty** - Niveau de difficulté (valeurs acceptées: "beginner", "intermediate", "advanced", "all_levels")
- **IsActive** - Statut actif (valeurs acceptées: "Yes", "No", "TRUE", "FALSE", "1", "0")

## Exemple de Données
\`\`\`
Name,Instructor,Capacity,Day,StartTime,EndTime,Description,Category,Difficulty,Location,IsActive
Yoga,Marie Dupont,20,monday,18:00,19:00,Cours de yoga pour tous,mind_body,all_levels,Salle 1,Yes
HIIT,Jean Martin,15,wednesday,19:30,20:30,Entraînement par intervalles de haute intensité,cardio,advanced,Salle 2,Yes
\`\`\`

## Formats de Fichier Acceptés
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)

## Modes d'Importation
- **Fusionner**: Ajoute de nouveaux cours et met à jour les cours existants
- **Remplacer**: Supprime tous les cours existants avant d'importer les nouveaux

## Conseils
- Les jours doivent être en anglais et en minuscules
- Les heures doivent être au format 24h (HH:MM)
- La capacité doit être un nombre entier positif
`;
        break;

      default:
        fileName = "documentation_import.md";
        content = "Documentation non disponible pour ce type de données.";
    }

    // Create a blob and download
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import & Export de Données</CardTitle>
        <CardDescription>
          Importez ou exportez les données de votre salle de sport
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Type de Données
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    onClick={() =>
                      downloadDocumentation(exportDataType as ImportDataType)
                    }
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Documentation</span>
                  </Button>
                </div>
                <Select
                  value={exportDataType}
                  onValueChange={(value) =>
                    setExportDataType(value as ExportDataType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de données" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Membres
                      </div>
                    </SelectItem>
                    <SelectItem value="payments">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Paiements
                      </div>
                    </SelectItem>
                    <SelectItem value="attendance">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Fréquentation
                      </div>
                    </SelectItem>
                    <SelectItem value="classes">
                      <div className="flex items-center">
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Cours
                      </div>
                    </SelectItem>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Toutes les données
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) =>
                    setExportFormat(value as ExportFormat)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel (.xlsx)
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        CSV (.csv)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center">
                        <FileJson className="h-4 w-4 mr-2" />
                        JSON (.json)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(exportDataType === "payments" ||
              exportDataType === "attendance" ||
              exportDataType === "all") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={exportDateRange.start.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setExportDateRange({
                        ...exportDateRange,
                        start: new Date(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={exportDateRange.end.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setExportDateRange({
                        ...exportDateRange,
                        end: new Date(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Exportation en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter les Données
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Type de Données
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    onClick={() => downloadDocumentation(importDataType)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Documentation</span>
                  </Button>
                </div>
                <Select
                  value={importDataType}
                  onValueChange={(value) =>
                    setImportDataType(value as ImportDataType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de données" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Membres
                      </div>
                    </SelectItem>
                    <SelectItem value="payments">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Paiements
                      </div>
                    </SelectItem>
                    <SelectItem value="attendance">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Fréquentation
                      </div>
                    </SelectItem>
                    <SelectItem value="classes">
                      <div className="flex items-center">
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Cours
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode d'Importation
                </label>
                <Select
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as ImportMode)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merge">
                      Fusionner avec les données existantes
                    </SelectItem>
                    <SelectItem value="replace">
                      Remplacer les données existantes
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier à Importer
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Télécharger un fichier</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx,.xls,.json"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV, Excel ou JSON jusqu'à 10MB
                  </p>
                  {importFile && (
                    <div className="flex items-center justify-center mt-2 text-sm text-gray-800">
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      {importFile.name}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 mt-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Besoin d'un exemple de fichier ?
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSampleFile(importDataType)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger un modèle
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {isImporting && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progression
                </label>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {importProgress < 100
                    ? "Importation en cours..."
                    : "Importation terminée !"}
                </p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleImport}
                disabled={isImporting || !importFile}
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importation en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer les Données
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import Result Dialog */}
        <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {importResult?.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    Importation Réussie
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    Erreur d'Importation
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Résultats de l'importation des données
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">
                    Total des enregistrements
                  </p>
                  <p className="text-lg font-semibold">
                    {importResult?.totalRecords || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">
                    Enregistrements importés
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {importResult?.importedRecords || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">
                    Enregistrements ignorés
                  </p>
                  <p className="text-lg font-semibold text-amber-600">
                    {importResult?.skippedRecords || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Type de données</p>
                  <p className="text-lg font-semibold flex items-center">
                    {getDataTypeIcon(importDataType)}
                    <span className="ml-1">
                      {importDataType === "members"
                        ? "Membres"
                        : importDataType === "payments"
                        ? "Paiements"
                        : importDataType === "attendance"
                        ? "Fréquentation"
                        : "Cours"}
                    </span>
                  </p>
                </div>
              </div>

              {importResult?.errors && importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Erreurs ({importResult.errors.length})
                  </AlertTitle>
                  <AlertDescription>
                    <div className="max-h-40 overflow-y-auto mt-2">
                      <ul className="list-disc pl-5 space-y-1">
                        {importResult.errors
                          .slice(0, 10)
                          .map((error: string, index: number) => (
                            <li key={index} className="text-sm">
                              {error}
                            </li>
                          ))}
                        {importResult.errors.length > 10 && (
                          <li className="text-sm font-medium">
                            ... et {importResult.errors.length - 10} autres
                            erreurs
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowImportResult(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
