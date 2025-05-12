import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Clock,
  MoreVertical,
  Trash,
  AlertCircle,
  Edit,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isToday,
  isYesterday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { DatePicker } from "../components/ui/date-picker";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  attendanceSchema,
  type AttendanceFormValues,
} from "../lib/validations/attendance";
import { supabase } from "../lib/supabase";
import MemberSearch from "../components/MemberSearch";
import { useNotifications } from "../context/NotificationContext";
import { searchByFullName, checkMemberPaymentStatus } from "../lib/utils";
import { AttendanceEditForm } from "../components/AttendanceEditForm";

const ITEMS_PER_PAGE = 10;

const AttendanceForm = ({
  defaultValues,
  onSubmit,
  isEditing = false,
}: {
  defaultValues?: Partial<AttendanceFormValues>;
  onSubmit: (data: AttendanceFormValues) => void;
  isEditing?: boolean;
}) => {
  const { addNotification } = useNotifications();
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    null
  );
  const [memberStatus, setMemberStatus] = React.useState<{
    isActive: boolean;
    hasValidPayment: boolean;
    membershipType: string | null;
  }>({
    isActive: false,
    hasValidPayment: false,
    membershipType: null,
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      memberId: "",
      checkInTime: new Date(),
      type: "gym",
      notes: "",
      ...defaultValues,
    },
  });

  const checkMemberStatus = async (memberId: string) => {
    try {
      // Use the utility function to check member payment status
      const status = await checkMemberPaymentStatus(memberId);

      // Update the state with the result
      setMemberStatus(status);

      // Show warnings if there are issues
      if (!status.isActive) {
        addNotification({
          title: "Adhésion Inactive",
          message: "L'adhésion de ce membre n'est pas active.",
          type: "warning",
        });
      }

      if (!status.hasValidPayment) {
        addNotification({
          title: "Paiement Requis",
          message: "Ce membre n'a pas de paiement valide enregistré.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Error checking member status:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la vérification du statut du membre",
        type: "error",
      });
    }
  };

  const handleMemberSelect = (member: { id: string }) => {
    setSelectedMemberId(member.id);
    form.setValue("memberId", member.id);
    checkMemberStatus(member.id);
  };

  React.useEffect(() => {
    if (defaultValues?.memberId) {
      setSelectedMemberId(defaultValues.memberId);
      checkMemberStatus(defaultValues.memberId);
    }
  }, [defaultValues?.memberId]);

  const handleSubmit = async (data: AttendanceFormValues) => {
    if (!memberStatus.hasValidPayment) {
      addNotification({
        title: "Impossible d'Enregistrer la Présence",
        message:
          "Le membre doit avoir un paiement valide pour enregistrer la présence.",
        type: "error",
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membre</FormLabel>
              <FormControl>
                <MemberSearch
                  onSelect={handleMemberSelect}
                  defaultValue={field.value}
                  showSelectedOnly={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMemberId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  memberStatus.isActive ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                Statut d'Adhésion:{" "}
                <span className="font-medium capitalize">
                  {memberStatus.isActive ? "Actif" : "Inactif"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  memberStatus.hasValidPayment ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                Statut de Paiement:{" "}
                <span className="font-medium">
                  {memberStatus.hasValidPayment ? "Valide" : "Paiement Requis"}
                </span>
              </span>
            </div>
            {memberStatus.membershipType && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">
                  Type d'Adhésion:{" "}
                  <span className="font-medium capitalize">
                    {memberStatus.membershipType === "basic" ? "Mensuel" :
                     memberStatus.membershipType === "premium" ? "Trimestriel" :
                     memberStatus.membershipType === "platinum" ? "Annuel" :
                     memberStatus.membershipType === "monthly" ? "Mensuel" :
                     memberStatus.membershipType === "quarterly" ? "Trimestriel" :
                     memberStatus.membershipType === "annual" ? "Annuel" :
                     memberStatus.membershipType === "day_pass" ? "Accès Journalier" :
                     memberStatus.membershipType}

                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <select
                {...field}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="gym">Salle de Sport</option>
                <option value="class">Cours</option>
                <option value="personal_training">
                  Entraînement Personnel
                </option>
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!memberStatus.hasValidPayment}
        >
          {isEditing ? "Mettre à Jour la Présence" : "Enregistrer la Présence"}
        </Button>

        {selectedMemberId && !memberStatus.hasValidPayment && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-md">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">
                Impossible d'enregistrer la présence
              </p>
              <p>
                Le membre doit avoir un paiement valide pour enregistrer la
                présence.
              </p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

const Attendance = () => {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const { addNotification } = useNotifications();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const pageSize = 10;

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);

      // Use the selected date for filtering
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      // Fetch attendance for the specific date
      const { data: attendanceData, error } = await supabase
        .from("attendance")
        .select(
          `
          *,
          member:members!attendance_member_id_fkey(first_name, last_name)
        `
        )
        .gte("check_in_time", dayStart.toISOString())
        .lt("check_in_time", dayEnd.toISOString())
        .order("check_in_time", { ascending: false });

      if (error) throw error;

      // Set the attendance data
      setAttendance(attendanceData || []);
      setTotalRecords(attendanceData?.length || 0);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la récupération des enregistrements de présence",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to perform automatic checkout
  const performAutoCheckout = useCallback(async () => {
    try {
      // Fetch the auto-checkout settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("gym_settings")
        .select("auto_checkout_minutes, auto_checkout_enabled")
        .limit(1);

      if (settingsError) throw settingsError;

      // Check if auto-checkout is enabled
      const autoCheckoutEnabled =
        settingsData && settingsData.length > 0
          ? settingsData[0].auto_checkout_enabled !== false // Default to true if undefined
          : true;

      // If auto-checkout is disabled, don't proceed
      if (!autoCheckoutEnabled) {
        return;
      }

      // Default to 4 hours (240 minutes) if no setting is found
      const autoCheckoutMinutes =
        settingsData && settingsData.length > 0
          ? settingsData[0].auto_checkout_minutes
          : 240;

      // Calculate the cutoff time
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - autoCheckoutMinutes);

      // Find members who need to be checked out
      const { data: overdueAttendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("id, member_id, check_in_time")
        .is("check_out_time", null) // Not checked out
        .lt("check_in_time", cutoffTime.toISOString()); // Check-in time older than cutoff

      if (attendanceError) throw attendanceError;

      if (overdueAttendance && overdueAttendance.length > 0) {
        // Perform batch update to check out all overdue members
        const { error: updateError } = await supabase
          .from("attendance")
          .update({ check_out_time: new Date().toISOString() })
          .in(
            "id",
            overdueAttendance.map((record) => record.id)
          );

        if (updateError) throw updateError;

        // If any records were updated and we're viewing today's attendance, refresh the list
        if (isToday(selectedDate)) {
          fetchAttendance();

          // Show notification only if records were updated
          if (overdueAttendance.length > 0) {
            addNotification({
              title: "Départ Automatique",
              message: `${overdueAttendance.length} membre(s) ont été automatiquement enregistrés comme partis après ${autoCheckoutMinutes} minutes.`,
              type: "info",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error performing automatic checkout:", error);
    }
  }, [selectedDate, addNotification]);

  // Set up interval for automatic checkout
  useEffect(() => {
    // Run once on component mount
    performAutoCheckout();

    // Set up interval (every 5 minutes)
    const interval = setInterval(performAutoCheckout, 5 * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [performAutoCheckout]);

  // Fetch attendance when selected date changes
  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleCreateAttendance = async (data: AttendanceFormValues) => {
    try {
      const { error } = await supabase.from("attendance").insert([
        {
          member_id: data.memberId,
          check_in_time: data.checkInTime.toISOString(),
          type: data.type,
          notes: data.notes,
        },
      ]);

      if (error) throw error;

      await fetchAttendance();
      setIsAddDialogOpen(false);
      addNotification({
        title: "Succès",
        message: "Présence enregistrée avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating attendance:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de l'enregistrement de la présence",
        type: "error",
      });
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const { error } = await supabase
        .from("attendance")
        .update({ check_out_time: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      // Update only the specific record
      setAttendance((prev) =>
        prev.map((record) =>
          record.id === id
            ? { ...record, check_out_time: new Date().toISOString() }
            : record
        )
      );

      addNotification({
        title: "Succès",
        message: "Départ enregistré avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error checking out:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de l'enregistrement du départ",
        type: "error",
      });
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    try {
      const { error } = await supabase.from("attendance").delete().eq("id", id);

      if (error) throw error;

      // Remove the deleted record from the state
      setAttendance((prev) => prev.filter((record) => record.id !== id));
      setTotalRecords((prev) => prev - 1);

      addNotification({
        title: "Succès",
        message: "Présence supprimée avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting attendance:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la suppression de la présence",
        type: "error",
      });
    }
  };

  const handleEditAttendance = async (data: any) => {
    try {
      const { error } = await supabase
        .from("attendance")
        .update({
          check_in_time: new Date(data.checkInTime).toISOString(),
          type: data.type,
          notes: data.notes,
          check_out_time: null, // Reset checkout when editing
        })
        .eq("id", selectedAttendance.id);

      if (error) throw error;

      await fetchAttendance();
      setIsEditDialogOpen(false);
      setSelectedAttendance(null);
      addNotification({
        title: "Succès",
        message: "Présence mise à jour avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la mise à jour de la présence",
        type: "error",
      });
    }
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "h:mm a");
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "En Cours";

    const duration =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60);
    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateHeader = () => {
    if (isToday(selectedDate)) {
      return "Aujourd'hui";
    } else if (isYesterday(selectedDate)) {
      return "Hier";
    } else {
      return format(selectedDate, "dd MMMM yyyy", { locale: fr });
    }
  };

  const isTodaySelected = isToday(selectedDate);

  // Filter attendance records based on search term
  const filteredAttendance = React.useMemo(() => {
    if (!searchTerm.trim()) return attendance;

    return attendance.filter((record) => {
      const fullName =
        `${record.member.first_name} ${record.member.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [attendance, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Présence</h1>

        {/* Responsive layout for date picker and buttons */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          {/* Date picker in its own row on mobile */}
          <div className="w-full sm:w-auto">
            <DatePicker
              date={selectedDate}
              setDate={(date) => date && setSelectedDate(date)}
              placeholder="Sélectionner une date"
              className="w-full sm:min-w-[240px]"
              inputClassName="bg-white shadow-sm"
              showNavigation={true}
            />
          </div>

          {/* Action buttons in their own row on mobile */}
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate("/qr-attendance")}
              className="flex items-center"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer la Présence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer la Présence</DialogTitle>
                  <DialogDescription>
                    Enregistrez les détails de présence du membre ci-dessous.
                  </DialogDescription>
                </DialogHeader>
                <AttendanceForm onSubmit={handleCreateAttendance} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h2 className="text-lg font-medium">{formatDateHeader()}</h2>
            <div className="md:hidden">
              {!isTodaySelected && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Aujourd'hui
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-xs">
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <div className="hidden md:block">
              {!isTodaySelected && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Aujourd'hui
                </Button>
              )}
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {attendance.length === 0
                    ? "Aucun enregistrement de présence trouvé"
                    : "Aucun résultat pour cette recherche"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/members/${record.member_id}`)}
                  >
                    {`${record.member.first_name} ${record.member.last_name}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatTime(record.check_in_time)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {record.check_out_time
                          ? formatTime(record.check_out_time)
                          : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDuration(
                      record.check_in_time,
                      record.check_out_time
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{record.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {!record.check_out_time && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(record.id)}
                        >
                          Check Out
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog
                            open={isEditDialogOpen}
                            onOpenChange={setIsEditDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedAttendance(record);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {selectedAttendance && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Modifier la Présence
                                  </DialogTitle>
                                  <DialogDescription>
                                    Mettez à jour les détails de présence
                                    ci-dessous.
                                  </DialogDescription>
                                </DialogHeader>
                                <AttendanceEditForm
                                  defaultValues={{
                                    checkInTime:
                                      selectedAttendance.check_in_time,
                                    type: selectedAttendance.type,
                                    notes: selectedAttendance.notes,
                                  }}
                                  onSubmit={handleEditAttendance}
                                />
                              </DialogContent>
                            )}
                          </Dialog>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={() => handleDeleteAttendance(record.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            {filteredAttendance.length} enregistrement
            {filteredAttendance.length !== 1 ? "s" : ""} trouvé
            {filteredAttendance.length !== 1 ? "s" : ""}
            {searchTerm && attendance.length !== filteredAttendance.length && (
              <span className="ml-1">sur {attendance.length} au total</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
