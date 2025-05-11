import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  User,
  Calendar,
  Clock,
  CreditCard,
  Edit,
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  AlertCircle,
  QrCode,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
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
import { supabase } from "../lib/supabase";
import { useNotifications } from "../context/NotificationContext";
import { toast } from "sonner";
import MemberForm from "../components/MemberForm";
import { MemberFormValues } from "../lib/validations/member";
import QRCodeGenerator from "../components/QRCodeGenerator";

type TimeRange = "week" | "month" | "year";

const MemberProfile = () => {
  // Always call hooks at the top level, in the same order
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // State hooks
  const [member, setMember] = React.useState<any>(null);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<TimeRange>("week");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [attendanceStats, setAttendanceStats] = React.useState({
    totalVisits: 0,
    avgDuration: 0,
    mostFrequentType: "",
  });
  const [isStatsLoading, setIsStatsLoading] = React.useState(false);

  // Pagination for attendance history
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case "week":
        return {
          // Use Monday as the start of the week (1) which is common in many countries
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: "Cette Semaine",
        };
      case "month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: "Ce Mois",
        };
      case "year":
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: "Cette Année",
        };
    }
  };

  // Function to calculate attendance stats from data
  const calculateAttendanceStats = (attendanceData: any[]) => {
    // Calculate attendance stats
    const totalVisits = attendanceData.length;

    // Filter for completed visits (those with check_out_time)
    const completedVisits = attendanceData.filter((a) => a.check_out_time);

    // Calculate total duration for completed visits
    const totalDuration = completedVisits.reduce((sum, a) => {
      const checkInTime = new Date(a.check_in_time).getTime();
      const checkOutTime = new Date(a.check_out_time).getTime();

      // Ensure check_out_time is after check_in_time to avoid negative durations
      if (checkOutTime > checkInTime) {
        return sum + (checkOutTime - checkInTime);
      }
      return sum;
    }, 0);

    // Calculate average duration in minutes, default to 0 if no completed visits
    const avgDuration = completedVisits.length
      ? totalDuration / completedVisits.length / (1000 * 60)
      : 0;

    // Count occurrences of each activity type
    const typeCounts: Record<string, number> = {};
    attendanceData.forEach((record) => {
      if (record.type) {
        typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;
      }
    });

    // Find most frequent activity type
    let mostFrequentType = "";
    let maxCount = 0;

    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        mostFrequentType = type;
        maxCount = count;
      }
    });

    return {
      totalVisits,
      avgDuration,
      mostFrequentType,
    };
  };

  // Function to fetch attendance data and update both stats and history
  const fetchAttendanceData = async (range: TimeRange) => {
    try {
      if (!id) {
        console.error("Member ID is missing");
        return;
      }

      const dateRange = getDateRange(range);

      // Ensure we have valid date range
      if (!dateRange || !dateRange.start || !dateRange.end) {
        console.error("Invalid date range", dateRange);
        return;
      }

      // Fetch all attendance records for the member (for the history table)
      const { data: allAttendanceData, error: allAttendanceError } =
        await supabase
          .from("attendance")
          .select("*")
          .eq("member_id", id)
          .order("check_in_time", { ascending: false });

      if (allAttendanceError) {
        console.error(
          "Supabase error fetching all attendance:",
          allAttendanceError
        );
        throw allAttendanceError;
      }

      // Ensure we have an array even if data is null
      const safeAllAttendanceData = allAttendanceData || [];

      // Update attendance history with all records
      setAttendance(safeAllAttendanceData);

      // Reset to first page when loading new data
      setCurrentPage(1);

      // Fetch attendance data for the selected time range (for stats)
      const { data: rangeAttendanceData, error: rangeAttendanceError } =
        await supabase
          .from("attendance")
          .select("*")
          .eq("member_id", id)
          .gte("check_in_time", dateRange.start.toISOString())
          .lte("check_in_time", dateRange.end.toISOString());

      if (rangeAttendanceError) {
        console.error(
          "Supabase error fetching range attendance:",
          rangeAttendanceError
        );
        throw rangeAttendanceError;
      }

      // Ensure we have an array even if data is null
      const safeRangeAttendanceData = rangeAttendanceData || [];

      // Calculate and update stats based on the time range data
      const stats = calculateAttendanceStats(safeRangeAttendanceData);
      setAttendanceStats(stats);

      return safeAllAttendanceData;
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      addNotification({
        title: "Erreur",
        message: "Échec du chargement des données de présence",
        type: "error",
      });
      return [];
    }
  };

  // Function to fetch only attendance stats without updating history
  const fetchAttendanceStats = async (range: TimeRange) => {
    try {
      setIsStatsLoading(true);

      if (!id) {
        console.error("Member ID is missing");
        return;
      }

      const dateRange = getDateRange(range);

      // Ensure we have valid date range
      if (!dateRange || !dateRange.start || !dateRange.end) {
        console.error("Invalid date range", dateRange);
        return;
      }

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("member_id", id)
        .gte("check_in_time", dateRange.start.toISOString())
        .lte("check_in_time", dateRange.end.toISOString());

      if (attendanceError) {
        console.error(
          "Supabase error fetching attendance stats:",
          attendanceError
        );
        throw attendanceError;
      }

      // Ensure we have an array even if data is null
      const safeAttendanceData = attendanceData || [];

      // Calculate and update stats only
      const stats = calculateAttendanceStats(safeAttendanceData);
      setAttendanceStats(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      addNotification({
        title: "Erreur",
        message: "Échec du chargement des statistiques de présence",
        type: "error",
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  const fetchMemberData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!id) {
        throw new Error("ID du membre requis");
      }

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (memberError) throw memberError;
      if (!memberData) throw new Error("Membre non trouvé");

      setMember(memberData);

      // Fetch attendance data for initial time range (both history and stats)
      await fetchAttendanceData(timeRange);

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("member_id", id)
        .order("payment_date", { ascending: false });

      if (paymentError) throw paymentError;
      setPayments(paymentData || []);
    } catch (error: any) {
      console.error("Error fetching member data:", error);
      setError(error.message);
      addNotification({
        title: "Erreur",
        message: error.message || "Échec du chargement des données du membre",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMemberData();
  }, [id]);

  // Update only attendance stats when time range changes
  React.useEffect(() => {
    if (id) {
      fetchAttendanceStats(timeRange);
    }
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string, dueDate: string) => {
    if (status === "pending" && new Date() > new Date(dueDate)) {
      return "bg-red-100 text-red-800";
    }
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to map membership types to valid enum values
  const mapMembershipType = (type: string): string => {
    // Map custom types to one of the allowed enum values
    switch (type) {
      case "monthly":
      case "quarterly":
      case "day_pass":
        return "basic"; // Map to basic
      case "annual":
        return "premium"; // Map to premium
      default:
        // If it's already a valid enum value, keep it
        if (["basic", "premium", "platinum"].includes(type)) {
          return type;
        }
        // Default to basic for any other custom type
        return "basic";
    }
  };

  const handleUpdateMember = async (data: MemberFormValues) => {
    try {
      if (!id) {
        throw new Error("ID du membre requis");
      }

      // Map the membership type to a valid enum value
      const mappedMembershipType = mapMembershipType(data.membershipType);

      const { error } = await supabase
        .from("members")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          membership_type: mappedMembershipType,
          start_date: data.startDate.toISOString(),
          status: data.status,
          notes: data.notes || null,
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Close the dialog
      setIsEditDialogOpen(false);

      // Refresh member data
      await fetchMemberData();

      toast.success("Informations du membre mises à jour avec succès");
    } catch (error: any) {
      console.error("Error updating member:", error);
      toast.error(error.message || "Échec de la mise à jour du membre");
    }
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="bg-red-50 text-red-600 rounded-full p-3 mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">
        {error || "Membre non trouvé"}
      </h1>
      <p className="text-gray-500 mb-6">
        Veuillez vérifier l'ID du membre et réessayer
      </p>
      <Button onClick={() => navigate("/members")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux Membres
      </Button>
    </div>
  );

  // Calculate paginated attendance records
  const paginatedAttendance = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return attendance.slice(startIndex, endIndex);
  }, [attendance, currentPage, ITEMS_PER_PAGE]);

  // Calculate total pages
  const totalPages = Math.ceil(attendance.length / ITEMS_PER_PAGE);

  // Render the appropriate content based on state
  if (isLoading) {
    return renderLoading();
  }

  if (error || !member) {
    return renderError();
  }

  // Main content - only rendered when we have data and no errors
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Membres
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier le Membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le Membre</DialogTitle>
              <DialogDescription>
                Mettre à jour les informations du membre ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              defaultValues={{
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email,
                phone: member.phone,
                membershipType: member.membership_type,
                startDate: new Date(member.start_date),
                status: member.status,
                notes: member.notes || "",
              }}
              onSubmit={handleUpdateMember}
              isEditing
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Member Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{`${member.first_name} ${member.last_name}`}</h1>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs capitalize mt-1 ${getStatusColor(
                  member.status
                )}`}
              >
                {member.status === "active"
                  ? "Actif"
                  : member.status === "inactive"
                  ? "Inactif"
                  : "Suspendu"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-900">{member.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Téléphone</label>
              <p className="text-gray-900">{member.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Type d'Adhésion</label>
              <p className="text-gray-900 capitalize">
                {member.membership_type}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Membre Depuis</label>
              <p className="text-gray-900">
                {format(new Date(member.start_date), "MMMM d, yyyy")}
              </p>
            </div>

            {/* QR Code Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center">
                  <QrCode className="h-4 w-4 mr-2 text-gray-500" />
                  Code QR d'Accès
                </h3>
              </div>
              <QRCodeGenerator
                memberId={member.id}
                memberName={`${member.first_name} ${member.last_name}`}
                size={150}
              />
              <p className="text-xs text-gray-500 text-center mt-3">
                Utilisez ce code QR pour l'enregistrement rapide des présences
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Stats Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Aperçu des Présences</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {getDateRange(timeRange).label}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeRange("week")}>
                  Cette Semaine
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange("month")}>
                  Ce Mois
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange("year")}>
                  Cette Année
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isStatsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-600 mb-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Visites Totales</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {attendanceStats.totalVisits}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-600 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Durée Moy.</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {Math.round(attendanceStats.avgDuration)} min
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-purple-600 mb-2">
                  <Dumbbell className="h-5 w-5" />
                  <span className="font-medium">
                    Activité la Plus Fréquente
                  </span>
                </div>
                <p className="text-2xl font-semibold capitalize">
                  {attendanceStats.mostFrequentType
                    ? attendanceStats.mostFrequentType.replace("_", " ")
                    : "Pas encore d'activités"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Résumé des Paiements</h2>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.slice(0, 3).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {payment.amount.toFixed(2)} MAD
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(payment.payment_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs capitalize ${getPaymentStatusColor(
                      payment.status,
                      payment.due_date
                    )}`}
                  >
                    {payment.status === "paid"
                      ? "Payé"
                      : payment.status === "pending"
                      ? "En attente"
                      : "Annulé"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucun historique de paiement trouvé
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Historique des Présences</h2>
          <div className="text-sm text-gray-500">
            {attendance.length > 0 && (
              <>
                Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, attendance.length)} sur{" "}
                {attendance.length} enregistrements
              </>
            )}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Entrée</TableHead>
              <TableHead>Sortie</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length > 0 ? (
              paginatedAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.check_in_time), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.check_in_time), "h:mm a")}
                  </TableCell>
                  <TableCell>
                    {record.check_out_time
                      ? format(new Date(record.check_out_time), "h:mm a")
                      : "En Cours"}
                  </TableCell>
                  <TableCell>
                    {record.check_out_time
                      ? (() => {
                          const duration =
                            (new Date(record.check_out_time).getTime() -
                              new Date(record.check_in_time).getTime()) /
                            (1000 * 60);
                          const hours = Math.floor(duration / 60);
                          const minutes = Math.floor(duration % 60);
                          return `${hours}h ${minutes}m`;
                        })()
                      : "-"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {record.type.replace("_", " ")}
                  </TableCell>
                  <TableCell>{record.notes || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Aucun enregistrement de présence trouvé pour la période
                  sélectionnée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Historique des Paiements</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Montant</TableHead>
              <TableHead>Date de Paiement</TableHead>
              <TableHead>Date d'Échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Mode de Paiement</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.amount.toFixed(2)} MAD</TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.due_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getPaymentStatusColor(
                        payment.status,
                        payment.due_date
                      )}`}
                    >
                      {payment.status === "paid"
                        ? "Payé"
                        : payment.status === "pending"
                        ? "En attente"
                        : "Annulé"}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_method.replace("_", " ")}
                  </TableCell>
                  <TableCell>{payment.notes || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Aucun historique de paiement trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MemberProfile;
