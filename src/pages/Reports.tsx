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
  { month: 'Feb', revenue: 14200 },
  { month: 'Mar', revenue: 15800 },
  { month: 'Apr', revenue: 13900 },
  { month: 'May', revenue: 16500 },
  { month: 'Jun', revenue: 18200 },
];

const membershipData = [
  { name: 'Monthly', value: 45 },
  { name: 'Quarterly', value: 30 },
  { name: 'Annual', value: 15 },
  { name: 'Day Pass', value: 10 },
];

const attendanceData = [
  { day: 'Mon', visitors: 68 },
  { day: 'Tue', visitors: 75 },
  { day: 'Wed', visitors: 82 },
  { day: 'Thu', visitors: 70 },
  { day: 'Fri', visitors: 90 },
  { day: 'Sat', visitors: 110 },
  { day: 'Sun', visitors: 45 },
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
          title: 'Invalid file type',
          message: 'Please upload an Excel (.xlsx, .xls) or CSV file',
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
              title: 'Error',
              message: 'Failed to parse the CSV file',
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
            membershipType: 'monthly',
            startDate: '2023-06-15'
          },
          { 
            firstName: 'Jane', 
            lastName: 'Smith', 
            email: 'jane.smith@example.com',
            phone: '(123) 456-7891',
            membershipType: 'quarterly',
            startDate: '2023-05-20'
          },
          { 
            firstName: 'Robert', 
            lastName: 'Johnson', 
            email: 'robert.j@example.com',
            phone: '(123) 456-7892',
            membershipType: 'annual',
            startDate: '2023-04-10'
          }
        ];
        
        setPreviewData(mockPreviewData);
        setShowPreview(true);
        
        // Show note about Excel parsing
        addNotification({
          title: 'Note',
          message: 'Excel parsing requires the xlsx library. Using mock data for preview.',
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
        throw new Error(`${invalidEntries.length} members have missing required fields`);
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
        title: 'Success',
        message: `Imported ${uploadedCount} members successfully`,
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
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to import members',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a template CSV file for member imports
    const headers = ['firstName', 'lastName', 'email', 'phone', 'membershipType', 'startDate'];
    const exampleRow = ['John', 'Doe', 'john.doe@example.com', '(123) 456-7890', 'monthly', '2023-01-15'];
    
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
    link.setAttribute('download', 'member_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      title: 'Template Downloaded',
      message: 'Member import template has been downloaded',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Import Members</h3>
          <p className="text-sm text-gray-500">Upload an Excel or CSV file to import multiple members at once</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
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
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              Excel or CSV files (max 5MB)
            </p>
          </div>
        </Label>
      </div>
      
      {showPreview && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Preview ({previewData.length} members)</h3>
            <Button variant="outline" size="sm" onClick={() => setIsAlertOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
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
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import {previewData.length} Members
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Import?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel? Your uploaded file and preview data will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setFile(null);
              setPreviewData([]);
              setShowPreview(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Yes, cancel import
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

  // Generate a detailed report based on the current selections
  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Fetch real data from Supabase based on the report type and date range
      let reportData: any[] = [];
      
      // Example of fetching data from Supabase (would be customized based on your schema)
      // In a real app, you would fetch data based on the activeTab and dateRange
      switch(activeTab) {
        case 'revenue':
          // const { data, error } = await supabase
          //   .from('payments')
          //   .select('*')
          //   .gte('created_at', dateRange.start)
          //   .lte('created_at', dateRange.end);
          // 
          // if (error) throw error;
          // reportData = data || [];
          
          // For demo, use the mock data
          reportData = revenueData;
          break;
          
        case 'members':
          // const { data, error } = await supabase
          //   .from('members')
          //   .select('*')
          //   .gte('created_at', dateRange.start)
          //   .lte('created_at', dateRange.end);
          //
          // if (error) throw error;
          // reportData = data || [];
          
          // For demo, use the mock data
          reportData = membershipData;
          break;
          
        case 'attendance':
          // const { data, error } = await supabase
          //   .from('attendance')
          //   .select('*')
          //   .gte('date', dateRange.start)
          //   .lte('date', dateRange.end);
          //
          // if (error) throw error;
          // reportData = data || [];
          
          // For demo, use the mock data
          reportData = attendanceData;
          break;
          
        default:
          // Custom report would combine data from multiple sources
          reportData = [...revenueData, ...attendanceData];
      }
      
      // Generate a report name based on the current selections
      const reportName = `${activeTab}_${reportType}_${format(new Date(dateRange.start), 'yyyy-MM-dd')}_to_${format(new Date(dateRange.end), 'yyyy-MM-dd')}`;
      
      // For PDF generation, you would typically use a library like jsPDF
      // For demo purposes, we'll just export a CSV
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
        title: 'Report Generated',
        message: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} report has been generated`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      addNotification({
        title: 'Generation Failed',
        message: 'Failed to generate report',
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
        title: 'Export Successful',
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} report has been exported`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      addNotification({
        title: 'Export Failed',
        message: 'Failed to export report',
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">View and export reports about your gym</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {canImport && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Members
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Import Members</DialogTitle>
                  <DialogDescription>
                    Upload an Excel or CSV file to import multiple members at once.
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
                Generating...
              </>
            ) : (
              <>
                <FilePieChart className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          
          <Button onClick={() => handleExport(activeTab)} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export
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
                Revenue
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'members' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('members')}
              >
                <Users className="h-4 w-4 mr-2" />
                Members
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'attendance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('attendance')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Attendance
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === 'custom' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Custom
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor="report-type" className="text-sm">Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="w-28">
                  <SelectValue placeholder="Monthly" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$107,200</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">547</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8.3% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg. Revenue Per Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$196</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +3.8% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="w-full h-[400px]">
              <h3 className="text-lg font-medium mb-4">Revenue Trends</h3>
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
                  <CardTitle>Revenue by Membership Type</CardTitle>
                  <CardDescription>
                    Distribution of revenue across different membership plans
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
                  <CardTitle>Revenue Insights</CardTitle>
                  <CardDescription>
                    Key observations based on current trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Increasing Trend</h4>
                        <p className="text-sm text-gray-500">Revenue has been consistently increasing by 5-10% month over month for the last 6 months.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Annual Memberships</h4>
                        <p className="text-sm text-gray-500">Annual membership renewals have a 78% retention rate, higher than industry average.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Seasonal Pattern</h4>
                        <p className="text-sm text-gray-500">Revenue spikes occur in January and September, aligning with new year resolutions and back-to-school periods.</p>
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
                  <CardTitle>Membership Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of current membership types
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
                  <CardTitle>Member Insights</CardTitle>
                  <CardDescription>
                    Key observations about member behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Activity Level</h4>
                        <p className="text-sm text-gray-500">62% of members visit at least twice per week, showing strong engagement.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Retention Rate</h4>
                        <p className="text-sm text-gray-500">Monthly membership retention rate is 68%, quarterly is 75%, and annual is 82%.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Demographics</h4>
                        <p className="text-sm text-gray-500">Largest age group is 25-34 (38%), followed by 35-44 (27%) and 18-24 (22%).</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Member Growth Trend</CardTitle>
                <CardDescription>
                  Net membership growth over time
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
              <h3 className="text-lg font-medium mb-4">Weekly Attendance</h3>
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
                  <CardTitle className="text-sm font-medium text-gray-500">Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5PM - 7PM</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Highest traffic period during weekdays
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Daily Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">185</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +7.6% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Visit Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">74 min</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +3.2% from last month
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
                <CardTitle>Custom Report Builder</CardTitle>
                <CardDescription>
                  Create custom reports by selecting metrics and date ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input id="report-name" placeholder="Q2 Performance Summary" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="report-category">Category</Label>
                      <Select defaultValue="financial">
                        <SelectTrigger id="report-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="membership">Membership</SelectItem>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input 
                        id="start-date" 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input 
                        id="end-date" 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Metrics to Include</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="revenue" className="rounded" defaultChecked />
                        <label htmlFor="revenue" className="text-sm">Revenue</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="members" className="rounded" defaultChecked />
                        <label htmlFor="members" className="text-sm">Members</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="attendance" className="rounded" defaultChecked />
                        <label htmlFor="attendance" className="text-sm">Attendance</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="classes" className="rounded" />
                        <label htmlFor="classes" className="text-sm">Classes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="staff" className="rounded" />
                        <label htmlFor="staff" className="text-sm">Staff</label>
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