import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, DollarSign, Users, Activity, Settings } from "lucide-react";

interface ReportHeaderProps {
  reportType: string;
  setReportType: (value: string) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const ReportHeader = ({
  reportType,
  setReportType,
  activeTab,
  setActiveTab
}: ReportHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="w-full max-w-xl">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500">
          <Button
            variant={activeTab === 'revenue' ? 'secondary' : 'ghost'}
            className="flex items-center gap-2 px-3"
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign className="h-4 w-4" />
            <span>Revenus</span>
          </Button>
          
          <Button
            variant={activeTab === 'members' ? 'secondary' : 'ghost'}
            className="flex items-center gap-2 px-3"
            onClick={() => setActiveTab('members')}
          >
            <Users className="h-4 w-4" />
            <span>Membres</span>
          </Button>
          
          <Button
            variant={activeTab === 'attendance' ? 'secondary' : 'ghost'}
            className="flex items-center gap-2 px-3"
            onClick={() => setActiveTab('attendance')}
          >
            <Activity className="h-4 w-4" />
            <span>Frequentation</span>
          </Button>
          
          <Button
            variant={activeTab === 'custom' ? 'secondary' : 'ghost'}
            className="flex items-center gap-2 px-3"
            onClick={() => setActiveTab('custom')}
          >
            <Settings className="h-4 w-4" />
            <span>Personnalise</span>
          </Button>
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
  );
}; 