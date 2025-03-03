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
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subMonths, parseISO, subDays, startOfMonth } from 'date-fns';
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
import { useReportsData } from '@/hooks/useReportsData';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { RevenueTrends } from '@/components/reports/RevenueTrends';

// Placeholder data for demonstration
const revenueData = [
  { month: 'Jan', revenue: 1250000 },
  { month: 'Fev', revenue: 1420000 },
  { month: 'Mar', revenue: 1580000 },
  { month: 'Avr', revenue: 1390000 },
  { month: 'Mai', revenue: 1650000 },
  { month: 'Jui', revenue: 1820000 },
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
          message: 'Veuillez telecharger un fichier Excel (.xlsx, .xls) ou CSV',
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
            console.error('Error parsing CSV:', error);
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
        
        // Show note about Excel parsing
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
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const obj: Record<string, string> = {};
      const currentLine = lines[i].split(',');
      
      for (let j = 0; j < headers.length; j++) {
        // Handle quoted values with commas
        let value = currentLine[j]?.trim() || '';
        
        // If value starts with a quote but doesn't end with one, it may contain commas
        if (value.startsWith('"') && !value.endsWith('"')) {
          let k = j + 1;
          // Keep adding parts until we find the closing quote
          while (k < currentLine.length) {
            value += ',' + currentLine[k];
            if (currentLine[k].endsWith('"')) break;
            k++;
          }
          j = k; // Skip the parts we've already processed
        }
        
        // Remove quotes if they exist
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
      // Validate the data before uploading
      const invalidEntries = previewData.filter(member => {
        const requiredFields = ['firstName', 'lastName', 'email', 'membershipType'];
        return requiredFields.some(field => !member[field]);
      });
      
      if (invalidEntries.length > 0) {
        throw new Error(`${invalidEntries.length} membres ont des champs obligatoires manquants`);
      }
      
      // Process members in batches to avoid overloading the database
      const batchSize = 20;
      const batches = [];
      
      // Split data into batches
      for (let i = 0; i < previewData.length; i += batchSize) {
        batches.push(previewData.slice(i, i + batchSize));
      }
      
      // Upload batches to Supabase
      let uploadedCount = 0;
      
      for (const batch of batches) {
        // Format the data according to your database schema
        const formattedBatch = batch.map(member => ({
          first_name: member.firstName,
          last_name: member.lastName,
          email: member.email,
          phone: member.phone,
          membership_type: member.membershipType,
          start_date: member.startDate
        }));
        
        // Upload to Supabase
        const { error } = await supabase
          .from('members')
          .upsert(formattedBatch, {
            onConflict: 'email', // Assuming email is unique 
            ignoreDuplicates: false
          });
        
        if (error) throw error;
        
        uploadedCount += batch.length;
      }
      
      addNotification({
        title: 'Succes',
        message: `${uploadedCount} membres importes avec succes`,
        type: 'success'
      });
      
      // Reset form
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading members:', error);
      addNotification({
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Echec de l\'importation des membres',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a template CSV file for member imports
    const headers = ['firstName', 'lastName', 'email', 'phone', 'membershipType', 'startDate'];
    const exampleRow = ['John', 'Doe', 'john.doe@example.com', '(123) 456-7890', 'mensuel', '2023-01-15'];
    
    // Create CSV content
    const templateContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_importation_membres.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      title: 'Modele Telecharge',
      message: 'Le modele d\'importation des membres a ete telecharge',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Importer des Membres</h3>
          <p className="text-sm text-gray-500">Telechargez un fichier Excel ou CSV pour importer plusieurs membres a la fois</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Telecharger le Modele
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
              {file ? file.name : 'Cliquez pour telecharger ou glissez-deposez'}
            </p>
            <p className="text-xs text-gray-500">
              Fichiers Excel ou CSV (max 5MB)
            </p>
          </div>
        </Label>
      </div>
      
      {showPreview && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Apercu ({previewData.length} membres)</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telephone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de Debut</th>
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
                      {format(parseISO(member.startDate), 'MMM d, yyyy')}
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
                  Importation...
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
            <AlertDialogTitle>Annuler l'Importation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir annuler ? Votre fichier telecharge et les donnees d'apercu seront supprimes.
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

const ReportsNew = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('revenue');
  const [reportType, setReportType] = useState('monthly');
  const { 
    summaryData, 
    monthlyComparison, 
    revenueData,
    isLoading, 
    calculatePercentageChange 
  } = useReportsData();

  return (
    <div className="space-y-8">
      <ReportHeader
        reportType={reportType}
        setReportType={setReportType}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <SummaryCards
        summaryData={summaryData}
        monthlyComparison={monthlyComparison}
        calculatePercentageChange={calculatePercentageChange}
        isLoading={isLoading}
      />
      
      {!isLoading && <RevenueTrends data={revenueData} />}
    </div>
  );
};

export default ReportsNew;