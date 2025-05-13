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
  Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { exportData } from '../../lib/utils/exportData';
import { format } from 'date-fns';

interface ReportHeaderProps {
  reportType: string;
  setReportType: (type: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reportType,
  setReportType,
  activeTab,
  setActiveTab
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeClasses, setIncludeClasses] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end: new Date()
  });
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Determine which data types to export based on checkboxes
      let dataType: 'members' | 'payments' | 'attendance' | 'classes' | 'all' = 'all';

      if (includeRevenue && !includeMembers && !includeAttendance && !includeClasses) {
        dataType = 'payments';
      } else if (!includeRevenue && includeMembers && !includeAttendance && !includeClasses) {
        dataType = 'members';
      } else if (!includeRevenue && !includeMembers && includeAttendance && !includeClasses) {
        dataType = 'attendance';
      } else if (!includeRevenue && !includeMembers && !includeAttendance && includeClasses) {
        dataType = 'classes';
      }

      // Export data
      await exportData({
        format: exportFormat,
        dataType,
        dateRange,
        fileName: `gympro_${activeTab}_${reportType}_${format(new Date(), 'yyyy-MM-dd')}`
      });

      setIsExporting(false);
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      setIsExporting(false);
    }
  };

  // Handle filter application
  const handleApplyFilters = () => {
    // Close the dialog
    setIsFilterDialogOpen(false);

    // The actual filtering logic would be implemented in the parent component
    // For now, we just close the dialog
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualisez et analysez les performances de votre salle de sport
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de rapport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Derniers 30 jours</SelectItem>
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="quarterly">Trimestriel</SelectItem>
            <SelectItem value="yearly">Annuel</SelectItem>
            <SelectItem value="custom">Personnalisé</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exporter les Rapports</DialogTitle>
              <DialogDescription>
                Choisissez le format et les données à exporter
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setExportFormat('xlsx')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setExportFormat('csv')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </Button>
                <Button
                  variant={exportFormat === 'json' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setExportFormat('json')}
                >
                  <FilePieChart className="h-4 w-4 mr-2" />
                  JSON (.json)
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Inclure dans le rapport</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include_revenue"
                      checked={includeRevenue}
                      onChange={(e) => setIncludeRevenue(e.target.checked)}
                    />
                    <label htmlFor="include_revenue" className="text-sm">Revenus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include_members"
                      checked={includeMembers}
                      onChange={(e) => setIncludeMembers(e.target.checked)}
                    />
                    <label htmlFor="include_members" className="text-sm">Membres</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include_attendance"
                      checked={includeAttendance}
                      onChange={(e) => setIncludeAttendance(e.target.checked)}
                    />
                    <label htmlFor="include_attendance" className="text-sm">Fréquentation</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include_classes"
                      checked={includeClasses}
                      onChange={(e) => setIncludeClasses(e.target.checked)}
                    />
                    <label htmlFor="include_classes" className="text-sm">Cours</label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Période</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Date de début</label>
                    <input
                      type="date"
                      className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        start: new Date(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Date de fin</label>
                    <input
                      type="date"
                      className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        end: new Date(e.target.value)
                      })}
                    />
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleExport}
                disabled={isExporting || (!includeRevenue && !includeMembers && !includeAttendance && !includeClasses)}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exportation...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le Rapport
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrer les Données</DialogTitle>
              <DialogDescription>
                Personnalisez les filtres pour affiner votre analyse
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Période</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Date de début</label>
                    <input
                      type="date"
                      className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        start: new Date(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Date de fin</label>
                    <input
                      type="date"
                      className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        end: new Date(e.target.value)
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Catégories</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filter_revenue"
                      checked={includeRevenue}
                      onChange={(e) => setIncludeRevenue(e.target.checked)}
                    />
                    <label htmlFor="filter_revenue" className="text-sm">Revenus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filter_expenses"
                      defaultChecked
                    />
                    <label htmlFor="filter_expenses" className="text-sm">Dépenses</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filter_members"
                      checked={includeMembers}
                      onChange={(e) => setIncludeMembers(e.target.checked)}
                    />
                    <label htmlFor="filter_members" className="text-sm">Membres</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filter_attendance"
                      checked={includeAttendance}
                      onChange={(e) => setIncludeAttendance(e.target.checked)}
                    />
                    <label htmlFor="filter_attendance" className="text-sm">Fréquentation</label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Types d'Abonnement</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_monthly" defaultChecked />
                    <label htmlFor="filter_monthly" className="text-sm">Mensuel</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_quarterly" defaultChecked />
                    <label htmlFor="filter_quarterly" className="text-sm">Trimestriel</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_annual" defaultChecked />
                    <label htmlFor="filter_annual" className="text-sm">Annuel</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_daily" defaultChecked />
                    <label htmlFor="filter_daily" className="text-sm">Journalier</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIncludeRevenue(true);
                    setIncludeMembers(true);
                    setIncludeAttendance(true);
                    setIncludeClasses(true);
                    setDateRange({
                      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                      end: new Date()
                    });
                  }}
                >
                  Réinitialiser
                </Button>
                <Button onClick={handleApplyFilters}>Appliquer les Filtres</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0">
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <button
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'revenue'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            Revenus
          </button>
          <button
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'members'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="h-4 w-4 mr-1.5" />
            Membres
          </button>
          <button
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'attendance'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Fréquentation
          </button>
          <button
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === 'performance'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('performance')}
          >
            <Activity className="h-4 w-4 mr-1.5" />
            Performance
          </button>
        </div>
      </div>
    </div>
  );
};
