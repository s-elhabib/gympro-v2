import React, { useState } from 'react';
import { 
  BarChart3, 
  FilePieChart, 
  FileSpreadsheet, 
  Download, 
  FileUp,
  Calendar, 
  DollarSign, 
  Users, 
  Activity,
  Filter,
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { format, subMonths, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Placeholder data for demonstration
const revenueData = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Fév', revenue: 14200 },
  { month: 'Mar', revenue: 15800 },
  { month: 'Avr', revenue: 13900 },
  { month: 'Mai', revenue: 16500 },
  { month: 'Juin', revenue: 18200 },
];

const membershipData = [
  { name: 'Mensuel', value: 45 },
  { name: 'Trimestriel', value: 30 },
  { name: 'Annuel', value: 15 },
  { name: 'Pass Journalier', value: 10 },
];

const attendanceData = [
  { day: 'Lun', visitors: 68 },
  { day: 'Mar', visitors: 75 },
  { day: 'Mer', visitors: 82 },
  { day: 'Jeu', visitors: 70 },
  { day: 'Ven', visitors: 90 },
  { day: 'Sam', visitors: 110 },
  { day: 'Dim', visitors: 45 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ImportMembersForm = () => {
  const { addNotification } = useNotifications();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is an Excel file or CSV
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        addNotification({
          title: 'Type de fichier invalide',
          message: 'Veuillez télécharger un fichier Excel (.xlsx, .xls) ou CSV',
          type: 'error'
        });
        return;
      }

      setFile(selectedFile);
      
      // Parse the file based on its type
      if (selectedFile.name.endsWith('.csv')) {
        // Parse CSV
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const csvData = event.target?.result as string;
            const parsedData = parseCSV(csvData);
            setPreviewData(parsedData);
            setShowPreview(true);
          } catch (error) {
            console.error('Erreur lors de l\'analyse du CSV:', error);
            addNotification({
              title: 'Erreur',
              message: 'Échec de l\'analyse du fichier CSV',
              type: 'error'
            });
          }
        };
        reader.readAsText(selectedFile);
      } else {
        // For Excel files, we'd need a library like xlsx
        // For demo purposes, we'll show mock data
        const mockPreviewData = [
          { 
            firstName: 'Jean', 
            lastName: 'Dupont', 
            email: 'jean.dupont@exemple.com',
            phone: '01 23 45 67 89',
            membershipType: 'mensuel',
            startDate: '2023-06-15'
          },
          { 
            firstName: 'Marie', 
            lastName: 'Martin', 
            email: 'marie.martin@exemple.com',
            phone: '01 23 45 67 90',
            membershipType: 'trimestriel',
            startDate: '2023-05-20'
          },
          { 
            firstName: 'Robert', 
            lastName: 'Dubois', 
            email: 'robert.d@exemple.com',
            phone: '01 23 45 67 91',
            membershipType: 'annuel',
            startDate: '2023-04-10'
          }
        ];
        
        setPreviewData(mockPreviewData);
        setShowPreview(true);
        
        addNotification({
          title: 'Note',
          message: 'L\'analyse Excel nécessite la bibliothèque xlsx. Utilisation de données de démonstration pour l\'aperçu.',
          type: 'info'
        });
      }
    }
  };
  
  // Helper function to parse CSV
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const result = [];
    const headers = lines[0].split(',').map(header => header.trim());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const obj: Record<string, string> = {};
      const currentLine = lines[i].split(',');
      
      for (let j = 0; j < headers.length; j++) {
        let value = currentLine[j]?.trim() || '';
        
        if (value.startsWith('"') && !value.endsWith('"')) {
          let k = j + 1;
          while (k < currentLine.length) {
            value += ',' + currentLine[k];
            if (currentLine[k].endsWith('"')) break;
            k++;
          }
          j = k;
        }
        
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        obj[headers[j]] = value;
      }
      
      result.push(obj);
    }
    
    return result;
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const invalidEntries = previewData.filter(member => {
        const requiredFields = ['firstName', 'lastName', 'email', 'membershipType'];
        return requiredFields.some(field => !member[field]);
      });
      
      if (invalidEntries.length > 0) {
        throw new Error(`${invalidEntries.length} membres ont des champs obligatoires manquants`);
      }
      
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < previewData.length; i += batchSize) {
        batches.push(previewData.slice(i, i + batchSize));
      }
      
      let uploadedCount = 0;
      
      for (const batch of batches) {
        const formattedBatch = batch.map(member => ({
          first_name: member.firstName,
          last_name: member.lastName,
          email: member.email,
          phone: member.phone,
          membership_type: member.membershipType,
          start_date: member.startDate
        }));
        
        const { error } = await supabase
          .from('members')
          .upsert(formattedBatch, {
            onConflict: 'email',
            ignoreDuplicates: false
          });
        
        if (error) throw error;
        
        uploadedCount += batch.length;
      }
      
      addNotification({
        title: 'Succès',
        message: `${uploadedCount} membres importés avec succès`,
        type: 'success'
      });
      
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation des membres:', error);
      addNotification({
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Échec de l\'importation des membres',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['prénom', 'nom', 'email', 'téléphone', 'typeAbonnement', 'dateDebut'];
    const exampleRow = ['Jean', 'Dupont', 'jean.dupont@exemple.com', '01 23 45 67 89', 'mensuel', '2023-01-15'];
    
    const templateContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');
    
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_membres.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      title: 'Modèle Téléchargé',
      message: 'Le modèle d\'importation des membres a été téléchargé',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Importer des Membres</h3>
          <p className="text-sm text-gray-500">Téléchargez un fichier Excel ou CSV pour importer plusieurs membres à la fois</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le Modèle
        </Button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload" className="cursor-pointer block">
          <div className="space-y-2">
            <UploadCloud className="h-10 w-10 text-blue-500 mx-auto" />
            <p className="text-sm font-medium">
              {file ? file.name : 'Cliquez pour télécharger ou glissez-déposez'}
            </p>
            <p className="text-xs text-gray-500">
              Fichiers Excel ou CSV (max 5Mo)
            </p>
          </div>
        </Label>
      </div>
      
      {showPreview && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Aperçu ({previewData.length} membres)</h3>
            <Button variant="outline" size="sm" onClick={() => setIsAlertOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de Début</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((member, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {member.membershipType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(member.startDate), 'd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importation en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Importer {previewData.length} Membres
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l'importation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler ? Votre fichier téléchargé et les données d'aperçu seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setFile(null);
              setPreviewData([]);
              setShowPreview(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Oui, annuler l'importation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Reports = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('revenue');
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canImport = isAdmin || isManager;

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let reportData: any[] = [];
      
      switch(activeTab) {
        case 'revenue':
          reportData = revenueData;
          break;
          
        case 'members':
          reportData = membershipData;
          break;
          
        case 'attendance':
          reportData = attendanceData;
          break;
          
        default:
          reportData = [...revenueData, ...attendanceData];
      }
      
      const reportName = `${activeTab}_${reportType}_${format(new Date(dateRange.start), 'yyyy-MM-dd')}_to_${format(new Date(dateRange.end), 'yyyy-MM-dd')}`;
      
      const csvContent = convertToCSV(reportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        title: 'Rapport Généré',
        message: `Le rapport ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} a été généré`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      addNotification({
        title: 'Échec de la Génération',
        message: 'Échec de la génération du rapport',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (type: string) => {
    setIsExporting(true);
    try {
      // Create data based on the report type
      let data: any[] = [];
      let fileName = '';
      
      switch(type) {
        case 'revenue':
          data = revenueData;
          fileName = 'revenue_report.csv';
          break;
        case 'members':
          data = membershipData;
          fileName = 'membership_report.csv';
          break;
        case 'attendance':
          data = attendanceData;
          fileName = 'attendance_report.csv';
          break;
        case 'monthly-revenue':
          data = revenueData;
          fileName = 'monthly_revenue_report.csv';
          break;
        case 'member-attendance':
          data = attendanceData;
          fileName = 'member_attendance_report.csv';
          break;
        case 'q1-financial':
          data = revenueData.slice(0, 3);
          fileName = 'q1_financial_report.csv';
          break;
        default:
          data = revenueData;
          fileName = 'custom_report.csv';
      }
      
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      
      // Create a Blob and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        title: 'Exportation Réussie',
        message: `Le rapport ${type.charAt(0).toUpperCase() + type.slice(1)} a été exporté`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation du rapport:', error);
      addNotification({
        title: 'Échec de l\'Exportation',
        message: 'Échec de l\'exportation du rapport',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper function to convert data to CSV
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const headerRow = headers.join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return headers.map(header => {
        // Handle values with commas by quoting them
        const value = item[header];
        const stringValue = String(value);
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',');
    });
    
    // Combine header and rows
    return [headerRow, ...rows].join('\n');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez et exportez des rapports sur votre salle de sport</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {canImport && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileUp className="h-4 w-4 mr-2" />
                  Importer des Membres
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Importer des Membres</DialogTitle>
                  <DialogDescription>
                    Téléchargez un fichier Excel ou CSV pour importer plusieurs membres à la fois.
                  </DialogDescription>
                </DialogHeader>
                <ImportMembersForm />
              </DialogContent>
            </Dialog>
          )}
          
          <Button variant="outline" onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <FilePieChart className="h-4 w-4 mr-2" />
                Générer un Rapport
              </>
            )}
          </Button>
          
          <Button onClick={() => handleExport(activeTab)} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exportation en cours...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="w-full">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 max-w-md grid grid-cols-4">
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'revenue' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('revenue')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Revenus
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'members' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('members')}
              >
                <Users className="h-4 w-4 mr-2" />
                Membres
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'attendance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('attendance')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Présence
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'custom' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Personnalisé
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor="report-type" className="text-sm">Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="w-28">
                  <SelectValue placeholder="Mensuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenu Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">107 200 €</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12,5% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Membres Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">547</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8,3% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Nouvelles Inscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5,2% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenu Moyen Par Membre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$196</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +3.8% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
        </div>
        
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="w-full h-[400px]">
              <h3 className="text-lg font-medium mb-4">Tendances des Revenus</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus par Type d'Abonnement</CardTitle>
                  <CardDescription>
                    Distribution des revenus selon les différents forfaits d'abonnement
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {membershipData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des Revenus</CardTitle>
                  <CardDescription>
                    Observations clés basées sur les tendances actuelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tendance à la Hausse</h4>
                        <p className="text-sm text-gray-500">Les revenus ont augmenté régulièrement de 5 à 10% mois après mois au cours des 6 derniers mois.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Abonnements Annuels</h4>
                        <p className="text-sm text-gray-500">Les renouvellements d'abonnements annuels ont un taux de rétention de 78%, supérieur à la moyenne du secteur.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tendance Saisonnière</h4>
                        <p className="text-sm text-gray-500">Des pics de revenus se produisent en janvier et septembre, correspondant aux résolutions du nouvel an et aux périodes de rentrée scolaire.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Abonnements</CardTitle>
                  <CardDescription>
                    Ventilation des types d'abonnements actuels
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {membershipData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des Membres</CardTitle>
                  <CardDescription>
                    Observations clés sur le comportement des membres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Niveau d'Activité</h4>
                        <p className="text-sm text-gray-500">62% des membres visitent au moins deux fois par semaine, montrant un fort engagement.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Taux de Rétention</h4>
                        <p className="text-sm text-gray-500">Le taux de rétention des abonnements mensuels est de 68%, trimestriels 75%, et annuels 82%.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Démographie</h4>
                        <p className="text-sm text-gray-500">Le groupe d'âge le plus important est 25-34 ans (38%), suivi par 35-44 ans (27%) et 18-24 ans (22%).</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Tendance de Croissance des Membres</CardTitle>
                <CardDescription>
                  Croissance nette des abonnements au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="New Members" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="w-full h-[400px]">
              <h3 className="text-lg font-medium mb-4">Présence Hebdomadaire</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitors" fill="#8b5cf6" name="Visitors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Heures de Pointe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5PM - 7PM</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Période de trafic la plus élevée en semaine
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Visites Quotidiennes Moy.</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">185</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +7.6% par rapport au mois dernier
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Durée Moy. des Visites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">74 min</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +3.2% par rapport au mois dernier
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'custom' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Générateur de Rapports Personnalisés</CardTitle>
                <CardDescription>
                  Créez des rapports personnalisés en sélectionnant des métriques et des plages de dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-name">Nom du Rapport</Label>
                      <Input id="report-name" placeholder="Q2 Performance Summary" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="report-category">Catégorie</Label>
                      <Select defaultValue="financial">
                        <SelectTrigger id="report-category">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financier</SelectItem>
                          <SelectItem value="membership">Abonnements</SelectItem>
                          <SelectItem value="attendance">Présence</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Date de Début</Label>
                      <Input 
                        id="start-date" 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Date de Fin</Label>
                      <Input 
                        id="end-date" 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Métriques à Inclure</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="revenue" className="rounded" defaultChecked />
                        <label htmlFor="revenue" className="text-sm">Revenus</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="members" className="rounded" defaultChecked />
                        <label htmlFor="members" className="text-sm">Membres</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="attendance" className="rounded" defaultChecked />
                        <label htmlFor="attendance" className="text-sm">Présence</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="classes" className="rounded" />
                        <label htmlFor="classes" className="text-sm">Cours</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="staff" className="rounded" />
                        <label htmlFor="staff" className="text-sm">Personnel</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="expenses" className="rounded" />
                        <label htmlFor="expenses" className="text-sm">Expenses</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline">Reset</Button>
                    <Button>Generate Custom Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Recent Reports</h2>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium">Monthly Revenue Report</h3>
                <p className="text-xs text-gray-500">Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleExport('monthly-revenue')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium">Member Attendance Summary</h3>
                <p className="text-xs text-gray-500">Generated on {format(subMonths(new Date(), 1), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleExport('member-attendance')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-purple-500 mr-3" />
              <div>
                <h3 className="font-medium">Q1 Financial Performance</h3>
                <p className="text-xs text-gray-500">Generated on {format(subMonths(new Date(), 3), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleExport('q1-financial')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;