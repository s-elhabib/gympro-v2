import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subMonths, parseISO, startOfMonth, endOfMonth } from 'date-fns';
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
import { MemberStats } from '@/components/MemberStats';


// Placeholder data for demonstration
// const revenueData = [
//   { month: 'Jan', revenue: 12500 },
//   { month: 'Fév', revenue: 14200 },
//   { month: 'Mar', revenue: 15800 },
//   { month: 'Avr', revenue: 13900 },
//   { month: 'Mai', revenue: 16500 },
//   { month: 'Juin', revenue: 18200 },
// ];

// const membershipData = [
//   { name: 'Mensuel', value: 45 },
//   { name: 'Trimestriel', value: 30 },
//   { name: 'Annuel', value: 15 },
//   { name: 'Pass Journalier', value: 10 },
// ];

// const attendanceData = [
//   { day: 'Lun', visitors: 68 },
//   { day: 'Mar', visitors: 75 },
//   { day: 'Mer', visitors: 82 },
//   { day: 'Jeu', visitors: 70 },
//   { day: 'Ven', visitors: 90 },
//   { day: 'Sam', visitors: 110 },
//   { day: 'Dim', visitors: 45 },
// ];

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
              message: 'Impossible de lire le fichier CSV',
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
            firstName: 'John', 
            lastName: 'Doe', 
            email: 'john.doe@example.com',
            phone: '(123) 456-7890',
            membershipType: 'mensuel',
            startDate: '2023-06-15'
          },
          { 
            firstName: 'Jane', 
            lastName: 'Smith', 
            email: 'jane.smith@example.com',
            phone: '(123) 456-7891',
            membershipType: 'trimestriel',
            startDate: '2023-05-20'
          },
          { 
            firstName: 'Robert', 
            lastName: 'Johnson', 
            email: 'robert.j@example.com',
            phone: '(123) 456-7892',
            membershipType: 'annuel',
            startDate: '2023-04-10'
          }
        ];
        
        setPreviewData(mockPreviewData);
        setShowPreview(true);
        
        addNotification({
          title: 'Note',
          message: 'L\'analyse Excel necessite la bibliotheque xlsx. Utilisation de donnees simulees pour l\'apercu.',
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
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    activeMembers: 0,
    newSignups: 0,
    avgRevenuePerMember: 0
  });
  const [monthlyComparison, setMonthlyComparison] = useState({
    revenue: { current: 0, previous: 0 },
    members: { current: 0, previous: 0 },
    newMembers: { current: 0, previous: 0 },
    avgRevenue: { current: 0, previous: 0 }
  });
  const [reportName, setReportName] = useState('');
  const [reportCategory, setReportCategory] = useState('financial');
  const [selectedMetrics, setSelectedMetrics] = useState({
    revenue: true,
    members: true,
    attendance: true,
    classes: false,
    staff: false,
    expenses: false
  });
  const [memberStats, setMemberStats] = useState({
    activityRate: 0,
    retention: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    },
    demographics: {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0
    }
  });
  const [memberGrowth, setMemberGrowth] = useState<{ month: string; members: number; }[]>([]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchSummaryData = async () => {
    try {
      const currentMonthStart = startOfMonth(new Date());
      const previousMonthStart = startOfMonth(subMonths(new Date(), 1));

      // Current month revenue
      const { data: currentRevenue } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', currentMonthStart.toISOString());

      // Previous month revenue
      const { data: previousRevenue } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Active members
      const { data: currentActiveMembers } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active');

      const { data: previousActiveMembers } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', currentMonthStart.toISOString());

      // New signups
      const { data: currentNewMembers } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: previousNewMembers } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Calculate totals
      const currentRevenueTotal = currentRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const previousRevenueTotal = previousRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const currentMembersCount = currentActiveMembers?.length || 0;
      const previousMembersCount = previousActiveMembers?.length || 0;
      const currentNewMembersCount = currentNewMembers?.length || 0;
      const previousNewMembersCount = previousNewMembers?.length || 0;

      // Update state
      setSummaryData({
        totalRevenue: currentRevenueTotal,
        activeMembers: currentMembersCount,
        newSignups: currentNewMembersCount,
        avgRevenuePerMember: currentMembersCount ? currentRevenueTotal / currentMembersCount : 0
      });

      setMonthlyComparison({
        revenue: { current: currentRevenueTotal, previous: previousRevenueTotal },
        members: { current: currentMembersCount, previous: previousMembersCount },
        newMembers: { current: currentNewMembersCount, previous: previousNewMembersCount },
        avgRevenue: { 
          current: currentMembersCount ? currentRevenueTotal / currentMembersCount : 0,
          previous: previousMembersCount ? previousRevenueTotal / previousMembersCount : 0
        }
      });

    } catch (error) {
      console.error('Error fetching summary data:', error);
    }
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      const startDate = startOfMonth(subMonths(new Date(), 5));
      const endDate = endOfMonth(new Date());

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .eq('status', 'paid');

      if (error) throw error;

      // Group payments by month
      const monthlyRevenue = payments?.reduce((acc: any, payment) => {
        const month = format(parseISO(payment.payment_date), 'MMM');
        acc[month] = (acc[month] || 0) + payment.amount;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(monthlyRevenue || {}).map(([month, revenue]) => ({
        month,
        revenue
      }));

      setRevenueData(chartData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  // Fetch membership distribution
  const fetchMembershipData = async () => {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select('membership_type')
        .eq('status', 'active');

      if (error) throw error;

      // Count membership types
      const distribution = members?.reduce((acc: any, member) => {
        acc[member.membership_type] = (acc[member.membership_type] || 0) + 1;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(distribution || {}).map(([name, value]) => ({
        name: name === 'monthly' ? 'Mensuel' :
              name === 'quarterly' ? 'Trimestriel' :
              name === 'annual' ? 'Annuel' :
              name === 'daily' ? 'Pass Journalier' : name,
        value
      }));

      setMembershipData(chartData);
    } catch (error) {
      console.error('Error fetching membership data:', error);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('check_in_time')
        .gte('check_in_time', subMonths(new Date(), 1).toISOString());

      if (error) throw error;

      // Group by day of week
      const weeklyAttendance = attendance?.reduce((acc: any, record) => {
        const day = format(parseISO(record.check_in_time), 'EEE');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(weeklyAttendance || {}).map(([day, visitors]) => ({
        day,
        visitors
      }));

      setAttendanceData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchRevenueData();
    fetchMembershipData();
    fetchAttendanceData();
    fetchSummaryData();
  }, []);

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
        title: 'Rapport Genere',
        message: `Le rapport ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} a ete genere`,
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
          fileName = 'rapport_revenus.csv';
          break;
        case 'members':
          data = membershipData;
          fileName = 'rapport_adhesions.csv';
          break;
        case 'attendance':
          data = attendanceData;
          fileName = 'rapport_frequentation.csv';
          break;
        case 'monthly-revenue':
          data = revenueData;
          fileName = 'rapport_revenus_mensuels.csv';
          break;
        case 'member-attendance':
          data = attendanceData;
          fileName = 'rapport_frequentation_membres.csv';
          break;
        case 'q1-financial':
          data = revenueData.slice(0, 3);
          fileName = 'rapport_financier_t1.csv';
          break;
        default:
          data = revenueData;
          fileName = 'rapport_personnalise.csv';
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

  const handleCustomReportGeneration = async () => {
    try {
      setIsGenerating(true);
      
      // Validate required fields
      if (!reportName.trim()) {
        addNotification({
          title: 'Erreur',
          message: 'Le nom du rapport est requis',
          type: 'error'
        });
        return;
      }

      // Collect data based on selected metrics
      const reportData: any = {};
      
      if (selectedMetrics.revenue) {
        const { data: revenueData } = await supabase
          .from('payments')
          .select('*')
          .gte('payment_date', dateRange.start)
          .lte('payment_date', dateRange.end);
        reportData.revenue = revenueData;
      }

      if (selectedMetrics.members) {
        const { data: membersData } = await supabase
          .from('members')
          .select('*')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
        reportData.members = membersData;
      }

      if (selectedMetrics.attendance) {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .gte('check_in_time', dateRange.start)
          .lte('check_in_time', dateRange.end);
        reportData.attendance = attendanceData;
      }

      // Generate CSV content
      let csvContent = '';
      Object.entries(reportData).forEach(([metric, data]) => {
        if (Array.isArray(data) && data.length > 0) {
          csvContent += `\n${metric.toUpperCase()}\n`;
          csvContent += convertToCSV(data);
          csvContent += '\n\n';
        }
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        title: 'Succes',
        message: 'Rapport personnalise genere avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating custom report:', error);
      addNotification({
        title: 'Erreur',
        message: 'Erreur lors de la generation du rapport personnalise',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setReportName('');
    setReportCategory('financial');
    setDateRange({
      start: subMonths(new Date(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedMetrics({
      revenue: true,
      members: true,
      attendance: true,
      classes: false,
      staff: false,
      expenses: false
    });
  };

  const fetchMemberStats = async () => {
    try {
      // Activity rate calculation
      const { data: activeMembers } = await supabase
        .from('check_ins')
        .select('member_id')
        .gte('created_at', subMonths(new Date(), 1))
        .gt('weekly_visits', 2);

      const { data: totalMembers } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active');

      // Retention rates calculation
      const monthStart = startOfMonth(subMonths(new Date(), 1));
      const quarterStart = startOfMonth(subMonths(new Date(), 3));
      const yearStart = startOfMonth(subMonths(new Date(), 12));

      const { data: monthlyRetention } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', monthStart);

      const { data: quarterlyRetention } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', quarterStart);

      const { data: yearlyRetention } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', yearStart);

      // Demographics calculation
      const { data: demographics } = await supabase
        .from('members')
        .select('birth_date')
        .eq('status', 'active');

      setMemberStats({
        activityRate: (activeMembers?.length || 0) / (totalMembers?.length || 1) * 100,
        retention: {
          monthly: (monthlyRetention?.length || 0) / (totalMembers?.length || 1) * 100,
          quarterly: (quarterlyRetention?.length || 0) / (totalMembers?.length || 1) * 100,
          yearly: (yearlyRetention?.length || 0) / (totalMembers?.length || 1) * 100
        },
        demographics: calculateAgeDemographics(demographics || [])
      });

      // Fetch member growth data
      const { data: monthlyGrowth } = await supabase
        .from('members')
        .select('created_at')
        .gte('created_at', subMonths(new Date(), 6))
        .order('created_at');

      const growthData = processMonthlyGrowth(monthlyGrowth || []);
      setMemberGrowth(growthData);

    } catch (error) {
      console.error('Error fetching member stats:', error);
    }
  };

  // Helper function to calculate age demographics
  const calculateAgeDemographics = (members: any[]) => {
    // Add your age calculation logic here
    return {
      '18-24': 22,
      '25-34': 38,
      '35-44': 27
    };
  };

  // Helper function to process monthly growth data
  const processMonthlyGrowth = (data: any[]) => {
    return data.reduce((acc: any[], member: any) => {
      const month = format(new Date(member.created_at), 'MMM');
      const existingMonth = acc.find(item => item.month === month);
      if (existingMonth) {
        existingMonth.members += 1;
      } else {
        acc.push({ month, members: 1 });
      }
      return acc;
    }, []);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez et exportez les rapports de votre salle de sport</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-3 w-full sm:w-auto">
          {canImport && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileUp className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Importer des Membres</span>
                  <span className="sm:hidden">Importer</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-3xl mx-4 sm:mx-0">
                <DialogHeader>
                  <DialogTitle>Importer des Membres</DialogTitle>
                  <DialogDescription>
                    Telechargez un fichier Excel ou CSV pour importer plusieurs membres a la fois.
                  </DialogDescription>
                </DialogHeader>
                <ImportMembersForm />
              </DialogContent>
            </Dialog>
          )}
          
          <Button variant="outline" onClick={generateReport} disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <span className="hidden sm:inline">Generation...</span>
                <span className="sm:hidden">Gen...</span>
              </>
            ) : (
              <>
                <FilePieChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generer un Rapport</span>
                <span className="sm:hidden">Generer</span>
              </>
            )}
          </Button>
          
          <Button onClick={() => handleExport(activeTab)} disabled={isExporting} className="w-full sm:w-auto">
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Exportation...</span>
                <span className="sm:hidden">Export...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="w-full overflow-x-auto">
            <div className="inline-flex h-auto sm:h-10 items-center justify-start sm:justify-center rounded-md bg-slate-100 p-1 text-slate-500 w-full sm:max-w-md">
              <div className="flex flex-col sm:flex-row w-full sm:grid sm:grid-cols-4">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 sm:px-3 py-2 sm:py-1.5 text-sm font-medium transition-all w-full ${
                    activeTab === 'revenue' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  onClick={() => setActiveTab('revenue')}
                >
                  <DollarSign className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Revenu</span>
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 sm:px-3 py-2 sm:py-1.5 text-sm font-medium transition-all w-full ${
                    activeTab === 'members' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  onClick={() => setActiveTab('members')}
                >
                  <Users className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Membres</span>
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 sm:px-3 py-2 sm:py-1.5 text-sm font-medium transition-all w-full ${
                    activeTab === 'attendance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Frequentation</span>
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 sm:px-3 py-2 sm:py-1.5 text-sm font-medium transition-all w-full ${
                    activeTab === 'custom' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  onClick={() => setActiveTab('custom')}
                >
                  <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">Personnalise</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Label htmlFor="report-type" className="text-sm">Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="w-full sm:w-28">
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
            
            <Button variant="outline" size="sm" className="flex items-center w-full sm:w-auto justify-center">
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
              <div className="text-2xl font-bold">
                {summaryData.totalRevenue.toLocaleString('fr-FR')} MAD
              </div>
              <p className={`text-xs flex items-center mt-1 ${
                calculatePercentageChange(
                  monthlyComparison.revenue.current,
                  monthlyComparison.revenue.previous
                ) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculatePercentageChange(
                  monthlyComparison.revenue.current,
                  monthlyComparison.revenue.previous
                ) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(calculatePercentageChange(
                  monthlyComparison.revenue.current,
                  monthlyComparison.revenue.previous
                )).toFixed(1)}% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Membres Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.activeMembers}</div>
              <p className={`text-xs flex items-center mt-1 ${
                calculatePercentageChange(
                  monthlyComparison.members.current,
                  monthlyComparison.members.previous
                ) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculatePercentageChange(
                  monthlyComparison.members.current,
                  monthlyComparison.members.previous
                ) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(calculatePercentageChange(
                  monthlyComparison.members.current,
                  monthlyComparison.members.previous
                )).toFixed(1)}% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Nouvelles Inscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.newSignups}</div>
              <p className={`text-xs flex items-center mt-1 ${
                calculatePercentageChange(
                  monthlyComparison.newMembers.current,
                  monthlyComparison.newMembers.previous
                ) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculatePercentageChange(
                  monthlyComparison.newMembers.current,
                  monthlyComparison.newMembers.previous
                ) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(calculatePercentageChange(
                  monthlyComparison.newMembers.current,
                  monthlyComparison.newMembers.previous
                )).toFixed(1)}% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenu Moyen Par Membre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData.avgRevenuePerMember.toLocaleString('fr-FR')} MAD
              </div>
              <p className={`text-xs flex items-center mt-1 ${
                calculatePercentageChange(
                  monthlyComparison.avgRevenue.current,
                  monthlyComparison.avgRevenue.previous
                ) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculatePercentageChange(
                  monthlyComparison.avgRevenue.current,
                  monthlyComparison.avgRevenue.previous
                ) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(calculatePercentageChange(
                  monthlyComparison.avgRevenue.current,
                  monthlyComparison.avgRevenue.previous
                )).toFixed(1)}% par rapport au mois dernier
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
                    formatter={(value) => [`${value} MAD`, 'Revenu']}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenu (MAD)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus par Type d'Adhesion</CardTitle>
                  <CardDescription>
                    Distribution des revenus selon les differents forfaits d'adhesion
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
                  <CardTitle>Apercu des Revenus</CardTitle>
                  <CardDescription>
                    Observations cles basees sur les tendances actuelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tendance a la Hausse</h4>
                        <p className="text-sm text-gray-500">Les revenus ont augmente de maniere constante de 5-10% mois apres mois au cours des 6 derniers mois.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Adhesions Annuelles</h4>
                        <p className="text-sm text-gray-500">Les renouvellements d'adhesion annuelle ont un taux de retention de 78%, superieur a la moyenne du secteur.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tendance Saisonniere</h4>
                        <p className="text-sm text-gray-500">Les pics de revenus se produisent en janvier et septembre, correspondant aux resolutions du nouvel an et a la rentree scolaire.</p>
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
                  <CardTitle>Distribution des Adhesions</CardTitle>
                  <CardDescription>
                    Repartition des types d'adhesion actuels
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
                  <CardTitle>Apercu des Membres</CardTitle>
                  <CardDescription>
                    Observations cles sur le comportement des membres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Niveau d'Activite</h4>
                        <p className="text-sm text-gray-500">
                          {memberStats.activityRate.toFixed(1)}% des membres visitent au moins deux fois par semaine
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Taux de Retention</h4>
                        <p className="text-sm text-gray-500">
                          Le taux de retention mensuel est de {memberStats.retention.monthly.toFixed(1)}%, 
                          trimestriel de {memberStats.retention.quarterly.toFixed(1)}%, 
                          et annuel de {memberStats.retention.yearly.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Demographie</h4>
                        <p className="text-sm text-gray-500">
                          Le groupe d'age le plus important est 25-34 ans ({memberStats.demographics['25-34']}%), 
                          suivi de 35-44 ans ({memberStats.demographics['35-44']}%) 
                          et 18-24 ans ({memberStats.demographics['18-24']}%)
                        </p>
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
                  <BarChart data={memberGrowth} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="members" fill="#10b981" name="Nouveaux Membres" />
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
                  <Bar dataKey="visitors" fill="#8b5cf6" name="Visiteurs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Heures de Pointe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">17h - 19h</div>
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
                      <Input 
                        id="report-name" 
                        placeholder="Resume Performance T2" 
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="report-category">Categorie</Label>
                      <Select value={reportCategory} onValueChange={setReportCategory}>
                        <SelectTrigger id="report-category">
                          <SelectValue placeholder="Selectionner une categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financier</SelectItem>
                          <SelectItem value="membership">Adhesion</SelectItem>
                          <SelectItem value="attendance">Frequentation</SelectItem>
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
                    <Label>Metriques a Inclure</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(selectedMetrics).map(([key, checked]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={key}
                            className="rounded"
                            checked={checked}
                            onChange={(e) => setSelectedMetrics(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                          />
                          <label htmlFor={key} className="text-sm capitalize">
                            {key === 'revenue' ? 'Revenus' :
                             key === 'members' ? 'Membres' :
                             key === 'attendance' ? 'Frequentation' :
                             key === 'classes' ? 'Cours' :
                             key === 'staff' ? 'Personnel' :
                             'Depenses'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={handleReset}>
                      Reinitialiser
                    </Button>
                    <Button 
                      onClick={handleCustomReportGeneration}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generation...' : 'Generer le Rapport'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Rapports Recents</h2>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium">Rapport Mensuel des Revenus</h3>
                <p className="text-xs text-gray-500">Genere le {format(new Date(), 'MMMM d, yyyy')}</p>
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
                <h3 className="font-medium">Resume de Frequentation des Membres</h3>
                <p className="text-xs text-gray-500">Genere le {format(subMonths(new Date(), 1), 'MMMM d, yyyy')}</p>
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
                <h3 className="font-medium">Performance Financiere T1</h3>
                <p className="text-xs text-gray-500">Genere le {format(subMonths(new Date(), 3), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleExport('q1-financial')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <MemberStats />
    </div>
  );
};

export default Reports;