import React from 'react';
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
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="quarterly">Trimestriel</SelectItem>
            <SelectItem value="yearly">Annuel</SelectItem>
            <SelectItem value="custom">Personnalisé</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog>
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
                <Button variant="outline" className="justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </Button>
                <Button variant="outline" className="justify-start">
                  <FilePieChart className="h-4 w-4 mr-2" />
                  PDF (.pdf)
                </Button>
                <Button variant="outline" className="justify-start">
                  <FilePieChart className="h-4 w-4 mr-2" />
                  Image (.png)
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Inclure dans le rapport</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include_revenue" defaultChecked />
                    <label htmlFor="include_revenue" className="text-sm">Revenus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include_members" defaultChecked />
                    <label htmlFor="include_members" className="text-sm">Membres</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include_attendance" defaultChecked />
                    <label htmlFor="include_attendance" className="text-sm">Fréquentation</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include_classes" defaultChecked />
                    <label htmlFor="include_classes" className="text-sm">Cours</label>
                  </div>
                </div>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le Rapport
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog>
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
                    <input type="date" className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Date de fin</label>
                    <input type="date" className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Catégories</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_revenue" defaultChecked />
                    <label htmlFor="filter_revenue" className="text-sm">Revenus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_expenses" defaultChecked />
                    <label htmlFor="filter_expenses" className="text-sm">Dépenses</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_members" defaultChecked />
                    <label htmlFor="filter_members" className="text-sm">Membres</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter_attendance" defaultChecked />
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
                <Button variant="outline">Réinitialiser</Button>
                <Button>Appliquer les Filtres</Button>
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
