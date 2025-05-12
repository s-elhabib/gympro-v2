import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, CalendarPlus } from "lucide-react";
import { format, parseISO, addMonths, isValid } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Payment, PaymentWithDisplayStatus } from "../types";
import { enhancePaymentWithDisplayStatus } from "../lib/utils/payment";
import PaymentHistoryTable, { SortConfig } from "../components/PaymentHistoryTable";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  paymentSchema,
  type PaymentFormValues,
} from "../lib/validations/payment";
import { supabase } from "../lib/supabase";
import MemberSearch from "../components/MemberSearch";
import { searchByFullName } from "../lib/utils";
import { useNotifications } from "../context/NotificationContext";
import { MembershipType, fetchMembershipTypes } from "../services/membershipService";

const ITEMS_PER_PAGE = 20; // Number of items to load at once

const PaymentForm = ({
  defaultValues,
  onSubmit,
  isEditing = false,
}: {
  defaultValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void;
  isEditing?: boolean;
}) => {
  const { addNotification } = useNotifications();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [selectedMemberType, setSelectedMemberType] = useState<string | null>(null);
  const [isLoadingMembershipTypes, setIsLoadingMembershipTypes] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      memberId: "",
      membershipType: undefined, // Use undefined instead of empty string
      amount: 0,
      paymentDate: new Date(),
      dueDate: new Date(),
      status: "pending",
      paymentMethod: "cash",
      notes: "",
      ...defaultValues,
    },
  });

  // Load membership types on component mount
  useEffect(() => {
    const loadMembershipTypes = async () => {
      console.log("Loading membership types...");
      setIsLoadingMembershipTypes(true);
      try {
        const types = await fetchMembershipTypes();
        console.log("Fetched membership types:", types);
        setMembershipTypes(types);

        // If we're editing and have a memberId, fetch the member's membership type
        if (isEditing && defaultValues?.memberId) {
          console.log("Editing mode, fetching member data for:", defaultValues.memberId);
          try {
            const { data: memberData, error } = await supabase
              .from("members")
              .select("membership_type")
              .eq("id", defaultValues.memberId)
              .single();

            console.log("Member data for editing:", memberData);
            if (error) throw error;

            if (memberData && memberData.membership_type) {
              console.log("Setting membership type for editing:", memberData.membership_type);

              // Find the membership type in our list
              const membershipType = types.find(
                (type) => type.type === memberData.membership_type
              );

              if (membershipType) {
                // If the membership type exists in our list, use it
                setSelectedMemberType(memberData.membership_type);
                form.setValue("membershipType", memberData.membership_type);
                console.log("Setting amount for editing:", membershipType.price);
                form.setValue("amount", membershipType.price);
              } else {
                // If the membership type doesn't exist in our list, check if it's one of the old types
                console.log("Membership type not found in list for editing, checking for equivalent type");

                // Try to find an equivalent type based on duration
                let equivalentType = null;

                // Map old types to new types
                if (memberData.membership_type === "basic" || memberData.membership_type === "premium" || memberData.membership_type === "platinum") {
                  // For old types, try to find an equivalent based on common naming
                  if (memberData.membership_type === "basic") {
                    // Try to find monthly
                    equivalentType = types.find(t => t.type === "monthly");
                  } else if (memberData.membership_type === "premium") {
                    // Try to find quarterly
                    equivalentType = types.find(t => t.type === "quarterly");
                  } else if (memberData.membership_type === "platinum") {
                    // Try to find annual
                    equivalentType = types.find(t => t.type === "annual");
                  }
                }

                // If we found an equivalent type, use it
                if (equivalentType) {
                  console.log("Found equivalent type for editing:", equivalentType.type);
                  setSelectedMemberType(equivalentType.type);
                  form.setValue("membershipType", equivalentType.type);
                  console.log("Setting amount for editing:", equivalentType.price);
                  form.setValue("amount", equivalentType.price);

                  // Update the member's membership type in the database
                  console.log("Updating member's membership type to equivalent type for editing");
                  const { error: updateError } = await supabase
                    .from("members")
                    .update({ membership_type: equivalentType.type })
                    .eq("id", defaultValues.memberId);

                  if (updateError) {
                    console.error("Error updating member's membership type for editing:", updateError);
                  } else {
                    console.log("Member's membership type updated successfully to equivalent type for editing");
                    addNotification({
                      title: "Type d'abonnement mis à jour",
                      message: `Le type d'abonnement du membre a été mis à jour vers ${equivalentType.type}`,
                      type: "info",
                    });
                  }
                } else {
                  // If no equivalent type found, use the first available type
                  console.log("No equivalent type found for editing, using first available type");
                  if (types.length > 0) {
                    const firstType = types[0];
                    console.log("Using first available type for editing:", firstType.type);
                    setSelectedMemberType(firstType.type);
                    form.setValue("membershipType", firstType.type);
                    console.log("Setting amount for editing:", firstType.price);
                    form.setValue("amount", firstType.price);

                    // Update the member's membership type in the database
                    console.log("Updating member's membership type in the database for editing");
                    const { error: updateError } = await supabase
                      .from("members")
                      .update({ membership_type: firstType.type })
                      .eq("id", defaultValues.memberId);

                    if (updateError) {
                      console.error("Error updating member's membership type for editing:", updateError);
                    } else {
                      console.log("Member's membership type updated successfully for editing");
                      addNotification({
                        title: "Type d'abonnement mis à jour",
                        message: `Le type d'abonnement du membre a été mis à jour vers ${firstType.type}`,
                        type: "info",
                      });
                    }
                  }
                }
              }
            }
          } catch (memberError) {
            console.error("Error fetching member data:", memberError);
          }
        }
      } catch (error) {
        console.error("Error loading membership types:", error);
        addNotification({
          title: "Erreur",
          message: "Impossible de charger les types d'abonnement",
          type: "error",
        });
      } finally {
        setIsLoadingMembershipTypes(false);
      }
    };

    loadMembershipTypes();
  }, [addNotification, isEditing, defaultValues, form]);

  // Update form when selectedMemberType changes
  useEffect(() => {
    if (selectedMemberType && selectedMemberType.trim() !== '') {
      console.log("selectedMemberType changed to:", selectedMemberType);
      form.setValue("membershipType", selectedMemberType);

      // Find the membership type and update the amount
      const membershipType = membershipTypes.find((t) => t.type === selectedMemberType);
      if (membershipType) {
        console.log("Setting amount from selectedMemberType effect:", membershipType.price);
        form.setValue("amount", membershipType.price);
      }
    }
  }, [selectedMemberType, membershipTypes, form]);

  // Fetch member's current membership type when a member is selected
  const handleMemberSelect = async (member: { id: string }) => {
    console.log("Member selected:", member.id);
    form.setValue("memberId", member.id);

    try {
      // Fetch the member's current membership type
      const { data: memberData, error } = await supabase
        .from("members")
        .select("membership_type")
        .eq("id", member.id)
        .single();

      console.log("Member data fetched:", memberData);
      if (error) {
        console.error("Error fetching member data:", error);
        throw error;
      }

      if (memberData && memberData.membership_type) {
        console.log("Setting membership type:", memberData.membership_type);

        // If membership types aren't loaded yet, fetch them first
        let typesToUse = membershipTypes;
        console.log("Current membership types:", membershipTypes);
        if (membershipTypes.length === 0) {
          try {
            console.log("Fetching membership types...");
            setIsLoadingMembershipTypes(true);
            const types = await fetchMembershipTypes();
            console.log("Fetched membership types:", types);
            setMembershipTypes(types);
            typesToUse = types;
          } catch (typeError) {
            console.error("Error loading membership types:", typeError);
          } finally {
            setIsLoadingMembershipTypes(false);
          }
        }

        // Find the membership type in our list
        const membershipType = typesToUse.find(
          (type) => type.type === memberData.membership_type
        );
        console.log("Found membership type:", membershipType);

        if (membershipType) {
          // If the membership type exists in our list, use it
          setSelectedMemberType(memberData.membership_type);
          form.setValue("membershipType", memberData.membership_type);
          console.log("Setting amount to:", membershipType.price);
          form.setValue("amount", membershipType.price);
        } else {
          // If the membership type doesn't exist in our list, check if it's one of the old types
          console.log("Membership type not found in list, checking for equivalent type");

          // Try to find an equivalent type based on duration
          let equivalentType = null;

          // Map old types to new types
          if (memberData.membership_type === "basic" || memberData.membership_type === "premium" || memberData.membership_type === "platinum") {
            // For old types, try to find an equivalent based on common naming
            if (memberData.membership_type === "basic") {
              // Try to find monthly
              equivalentType = typesToUse.find(t => t.type === "monthly");
            } else if (memberData.membership_type === "premium") {
              // Try to find quarterly
              equivalentType = typesToUse.find(t => t.type === "quarterly");
            } else if (memberData.membership_type === "platinum") {
              // Try to find annual
              equivalentType = typesToUse.find(t => t.type === "annual");
            }
          }

          // If we found an equivalent type, use it
          if (equivalentType) {
            console.log("Found equivalent type:", equivalentType.type);
            setSelectedMemberType(equivalentType.type);
            form.setValue("membershipType", equivalentType.type);
            console.log("Setting amount to:", equivalentType.price);
            form.setValue("amount", equivalentType.price);

            // Update the member's membership type in the database
            console.log("Updating member's membership type to equivalent type");
            const { error: updateError } = await supabase
              .from("members")
              .update({ membership_type: equivalentType.type })
              .eq("id", member.id);

            if (updateError) {
              console.error("Error updating member's membership type:", updateError);
            } else {
              console.log("Member's membership type updated successfully to equivalent type");
              addNotification({
                title: "Type d'abonnement mis à jour",
                message: `Le type d'abonnement du membre a été mis à jour vers ${equivalentType.type}`,
                type: "info",
              });
            }
          } else {
            // If no equivalent type found, use the first available type
            console.log("No equivalent type found, using first available type");
            if (typesToUse.length > 0) {
              const firstType = typesToUse[0];
              console.log("Using first available type:", firstType.type);
              setSelectedMemberType(firstType.type);
              form.setValue("membershipType", firstType.type);
              console.log("Setting amount to:", firstType.price);
              form.setValue("amount", firstType.price);

              // Update the member's membership type in the database
              console.log("Updating member's membership type in the database");
              const { error: updateError } = await supabase
                .from("members")
                .update({ membership_type: firstType.type })
                .eq("id", member.id);

              if (updateError) {
                console.error("Error updating member's membership type:", updateError);
              } else {
                console.log("Member's membership type updated successfully");
                addNotification({
                  title: "Type d'abonnement mis à jour",
                  message: `Le type d'abonnement du membre a été mis à jour vers ${firstType.type}`,
                  type: "info",
                });
              }
            } else {
              console.log("No membership types available");
              addNotification({
                title: "Erreur",
                message: "Aucun type d'abonnement disponible",
                type: "error",
              });
            }
          }
        }
      } else {
        console.log("No membership type found for member");
      }
    } catch (error) {
      console.error("Error in handleMemberSelect:", error);
    }
  };

  // Update amount when membership type changes
  const handleMembershipTypeChange = (type: string) => {
    // Don't process empty strings
    if (!type) {
      console.log("Empty membership type received, ignoring");
      return;
    }

    console.log("Membership type changed to:", type);
    setSelectedMemberType(type);
    form.setValue("membershipType", type);

    // Find the membership type and update the amount
    const membershipType = membershipTypes.find((t) => t.type === type);
    console.log("Found membership type for change:", membershipType);

    if (membershipType) {
      console.log("Setting amount for change:", membershipType.price);
      form.setValue("amount", membershipType.price);

      // Force form update
      setTimeout(() => {
        form.trigger("membershipType");
        form.trigger("amount");
      }, 0);
    } else {
      console.warn(`Membership type "${type}" not found in available types`);
      // Keep the current amount if no matching membership type is found
    }
  };

  const handleAddOneMonth = () => {
    const currentDueDate = form.getValues("dueDate");
    const newDueDate = addMonths(currentDueDate, 1);
    form.setValue("dueDate", newDueDate);
  };

  // Helper function to safely format dates
  const formatDateForInput = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!isValid(dateObj)) return "";

    return format(dateObj, "yyyy-MM-dd");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="membershipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type Abonnement</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value) handleMembershipTypeChange(value);
                }}
                value={field.value || selectedMemberType || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type d'abonnement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingMembershipTypes ? (
                    <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                      Chargement des types d'abonnement...
                    </div>
                  ) : membershipTypes.length === 0 ? (
                    <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                      Aucun type d'abonnement disponible
                    </div>
                  ) : (
                    membershipTypes.map((type) => (
                      <SelectItem key={type.id} value={type.type}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {type.type.charAt(0).toUpperCase() + type.type.slice(1).replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {type.price} MAD - {type.duration} jours
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Paiement</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : new Date()
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between items-center">
                  <span>Date d'Echeance</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOneMonth}
                    className="h-6 px-2 text-xs"
                  >
                    <CalendarPlus className="h-3 w-3 mr-1" />
                    +1 Mois
                  </Button>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : new Date()
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="paid">Paye</SelectItem>
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="overdue">En Retard</SelectItem>
                  <SelectItem value="cancelled">Annule</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode de Paiement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le mode de paiement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Especes</SelectItem>
                  <SelectItem value="credit_card">Carte de Credit</SelectItem>
                  <SelectItem value="debit_card">Carte de Debit</SelectItem>
                  <SelectItem value="bank_transfer">
                    Virement Bancaire
                  </SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />



        <Button type="submit" className="w-full">
          {isEditing ? "Mettre a jour le Paiement" : "Enregistrer le Paiement"}
        </Button>
      </form>
    </Form>
  );
};

const Payments = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [payments, setPayments] = React.useState<PaymentWithDisplayStatus[]>(
    []
  );
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [allPaymentsLoaded, setAllPaymentsLoaded] = React.useState(false);

  // Reference to all payments for virtual scrolling
  const [allPayments, setAllPayments] = React.useState<
    PaymentWithDisplayStatus[]
  >([]);

  // Pagination state for PaymentHistoryTable
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [displayedPayments, setDisplayedPayments] = React.useState<PaymentWithDisplayStatus[]>([]);

  // Sorting state
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  // Initial fetch to get all payments and sort them
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setPayments([]);
      setDisplayedPayments([]);

      // First, fetch all membership types to get their durations
      const { data: membershipTypes, error: membershipTypesError } = await supabase
        .from("membership_types")
        .select("*");

      if (membershipTypesError) {
        console.error("Error fetching membership types:", membershipTypesError);
        throw new Error(`Error fetching membership types: ${membershipTypesError.message}`);
      }

      // Create a map of membership type to duration for quick lookup
      const membershipDurations = new Map();
      membershipTypes.forEach(type => {
        membershipDurations.set(type.type, type.duration);
      });

      // Default duration if membership type not found
      const DEFAULT_DURATION = 30; // 30 days

      // Fetch all payments with member details including membership_type
      let { data, error } = await supabase.from("payments").select(
        `
          *,
          member:members!payments_member_id_fkey(first_name, last_name, membership_type)
        `
      );

      if (error) {
        console.error("Supabase query error:", error);
        throw new Error(`Error fetching payments: ${error.message}`);
      }

      // Group payments by member_id and find the most recent payment for each member
      const memberLatestPayments = new Map();

      if (data) {
        data.forEach(payment => {
          const memberId = payment.member_id;
          const paymentDate = new Date(payment.payment_date);

          if (!memberLatestPayments.has(memberId) ||
              paymentDate > new Date(memberLatestPayments.get(memberId).payment_date)) {
            memberLatestPayments.set(memberId, payment);
          }
        });
      }

      // Convert the Map to an array of the most recent payments
      const latestPayments = Array.from(memberLatestPayments.values());

      // Filter by search term if needed
      let filteredBySearch = latestPayments;
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filteredBySearch = latestPayments.filter((payment) => {
          const firstName = payment.member?.first_name?.toLowerCase() || "";
          const lastName = payment.member?.last_name?.toLowerCase() || "";
          const fullName = `${firstName} ${lastName}`;

          return (
            firstName.includes(searchTermLower) ||
            lastName.includes(searchTermLower) ||
            fullName.includes(searchTermLower)
          );
        });
      }

      // Filter payments to only show those that are near due date or overdue
      // based on the membership type duration
      const now = new Date();
      const filteredPayments = filteredBySearch.filter(payment => {
        // Skip cancelled payments
        if (payment.status === "cancelled") return false;

        const dueDate = parseISO(payment.due_date);

        // Get the membership type duration
        const membershipType = payment.member?.membership_type || "monthly";
        const duration = membershipDurations.get(membershipType) || DEFAULT_DURATION;

        // Calculate days until due date (negative if overdue)
        const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Define "near due date" as within 15% of the membership duration
        const nearDueDateThreshold = Math.max(7, Math.floor(duration * 0.15)); // At least 7 days or 15% of duration

        // Show if:
        // 1. Payment is overdue (daysDiff < 0)
        // 2. Payment is near due date (0 <= daysDiff <= nearDueDateThreshold)
        return daysDiff <= nearDueDateThreshold;
      });

      // Enhance payments with display status
      const enhancedPayments = filteredPayments.map((payment) =>
        enhancePaymentWithDisplayStatus(payment as Payment)
      );

      // Helper function to calculate days difference for overdue payments
      const getDaysDifference = (dueDate: string): number => {
        const today = new Date();
        const due = parseISO(dueDate);
        return Math.abs(Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      };

      // Sort payments by status priority: overdue first (sorted by days overdue), then near_overdue, then others
      let sortedPayments = [...enhancedPayments];

      // Apply sort config if available
      if (sortConfig) {
        sortedPayments = sortPaymentsByConfig(sortedPayments, sortConfig);
      } else {
        // Default sort by status priority
        sortedPayments.sort((a, b) => {
          // Define status priority (lower number = higher priority)
          const getPriority = (status: string): number => {
            switch (status) {
              case "overdue":
                return 1;
              case "near_overdue":
                return 2;
              case "pending":
                return 3;
              case "paid":
                return 4;
              case "cancelled":
                return 5;
              default:
                return 6;
            }
          };

          // First compare by status priority
          const priorityDiff = getPriority(a.displayStatus) - getPriority(b.displayStatus);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          // If both are overdue, sort by days overdue (greatest first)
          if (a.displayStatus === "overdue" && b.displayStatus === "overdue") {
            const aDays = getDaysDifference(a.due_date);
            const bDays = getDaysDifference(b.due_date);
            return bDays - aDays; // Descending order (greatest first)
          }

          // If both are near_overdue, sort by days until due (smallest first)
          if (a.displayStatus === "near_overdue" && b.displayStatus === "near_overdue") {
            const aDays = getDaysDifference(a.due_date);
            const bDays = getDaysDifference(b.due_date);
            return aDays - bDays; // Ascending order (smallest first)
          }

          // For other statuses, sort by due date
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      }

      // Store all sorted payments
      setAllPayments(sortedPayments);
      setAllPaymentsLoaded(true);

      // Calculate pagination
      const total = sortedPayments.length;
      setTotalRecords(total);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

      // Update displayed payments based on current page
      updateDisplayedPayments(sortedPayments, currentPage);

      // For backward compatibility with infinite scroll
      const initialItems = sortedPayments.slice(0, ITEMS_PER_PAGE);
      setPayments(initialItems);
      setHasNextPage(sortedPayments.length > ITEMS_PER_PAGE);
    } catch (error: any) {
      console.error("Error fetching payments:", error);

      // Show a more detailed error message
      addNotification({
        title: "Erreur",
        message: `Impossible de récupérer les paiements: ${
          error.message || "Erreur inconnue"
        }`,
        type: "error",
      });

      // Clear the search term if it caused the error
      if (searchTerm) {
        setSearchTerm("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update displayed payments based on current page
  const updateDisplayedPayments = (allPayments: PaymentWithDisplayStatus[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayedPayments(allPayments.slice(start, end));
  };

  // Helper function to sort payments by config
  const sortPaymentsByConfig = (payments: PaymentWithDisplayStatus[], config: SortConfig) => {
    if (!config) return payments;

    return [...payments].sort((a, b) => {
      let aValue: any = a[config.key as keyof Payment];
      let bValue: any = b[config.key as keyof Payment];

      // Handle member name sorting
      if (config.key === "member") {
        aValue = `${a.member.first_name} ${a.member.last_name}`;
        bValue = `${b.member.first_name} ${b.member.last_name}`;
      }

      // Handle date sorting
      if (config.key === "due_date" || config.key === "payment_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return config.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort request
  const handleRequestSort = (key: keyof Payment | "member") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const newConfig = { key, direction };
    setSortConfig(newConfig);

    // Re-sort all payments with the new config
    const sortedPayments = sortPaymentsByConfig(allPayments, newConfig);
    updateDisplayedPayments(sortedPayments, currentPage);
  };

  // Load more items for infinite scrolling
  const loadMoreItems = async () => {
    if (!hasNextPage || !allPaymentsLoaded) return Promise.resolve();

    return new Promise<void>((resolve) => {
      // Simulate a delay to show loading indicator
      setTimeout(() => {
        const nextPage = currentPage + 1;
        const startIndex = nextPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        // Get the next batch of items
        const newItems = allPayments.slice(startIndex, endIndex);

        if (newItems.length > 0) {
          // Append new items to the current list
          setPayments((prev) => [...prev, ...newItems]);
          setCurrentPage(nextPage);

          // Check if we've loaded all items
          setHasNextPage(endIndex < allPayments.length);
        } else {
          setHasNextPage(false);
        }

        resolve();
      }, 500); // Small delay for better UX
    });
  };

  // Fetch payments when search term changes
  React.useEffect(() => {
    fetchPayments();
  }, [searchTerm]);

  // Update displayed payments when current page changes
  React.useEffect(() => {
    if (allPaymentsLoaded) {
      let paymentsToDisplay = [...allPayments];

      // Apply sort config if available
      if (sortConfig) {
        paymentsToDisplay = sortPaymentsByConfig(paymentsToDisplay, sortConfig);
      }

      updateDisplayedPayments(paymentsToDisplay, currentPage);
    }
  }, [currentPage, allPaymentsLoaded]);

  const handleCreatePayment = async (data: PaymentFormValues) => {
    try {
      const newPayment = {
        member_id: data.memberId,
        amount: data.amount,
        payment_date: data.paymentDate.toISOString(),
        due_date: data.dueDate.toISOString(),
        status: data.status,
        payment_method: data.paymentMethod,
        notes: data.notes || null,
      };

      const { error } = await supabase.from("payments").insert([newPayment]);

      if (error) throw error;

      // If membership type has changed, update the member record
      if (data.membershipType) {
        const { error: memberUpdateError } = await supabase
          .from("members")
          .update({ membership_type: data.membershipType })
          .eq("id", data.memberId);

        if (memberUpdateError) {
          console.error("Error updating member membership type:", memberUpdateError);
          // Don't throw here, we still want to show success for the payment
        }
      }

      // Refresh data to include the new payment
      await fetchPayments();
      setIsAddDialogOpen(false);

      addNotification({
        title: "Succès",
        message: "Paiement enregistré avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      addNotification({
        title: "Erreur",
        message: "Impossible d'enregistrer le paiement",
        type: "error",
      });
    }
  };

  const handleUpdatePayment = async (data: PaymentFormValues) => {
    if (!selectedPayment) return;

    try {
      const updatedPayment = {
        member_id: data.memberId,
        amount: data.amount,
        payment_date: data.paymentDate.toISOString(),
        due_date: data.dueDate.toISOString(),
        status: data.status,
        payment_method: data.paymentMethod,
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from("payments")
        .update(updatedPayment)
        .eq("id", selectedPayment.id);

      if (error) throw error;

      // If membership type has changed, update the member record
      if (data.membershipType) {
        const { error: memberUpdateError } = await supabase
          .from("members")
          .update({ membership_type: data.membershipType })
          .eq("id", data.memberId);

        if (memberUpdateError) {
          console.error("Error updating member membership type:", memberUpdateError);
          // Don't throw here, we still want to show success for the payment update
        }
      }

      // Refresh all payments to reflect the update
      await fetchPayments();
      setIsEditDialogOpen(false);
      setSelectedPayment(null);

      addNotification({
        title: "Succès",
        message: "Paiement mis à jour avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      addNotification({
        title: "Erreur",
        message: "Impossible de mettre à jour le paiement",
        type: "error",
      });
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);

      if (error) throw error;

      // Refresh data after deletion
      await fetchPayments();

      addNotification({
        title: "Succès",
        message: "Paiement supprimé avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      addNotification({
        title: "Erreur",
        message: "Impossible de supprimer le paiement",
        type: "error",
      });
    }
  };

  // Helper function to calculate days difference for overdue payments
  const getDaysDifference = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    return differenceInDays(today, due);
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "-";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Paiements</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer un Paiement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
              <DialogDescription>
                Saisissez les details du paiement ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onSubmit={handleCreatePayment} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher des paiements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <PaymentHistoryTable
        payments={displayedPayments}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        sortConfig={sortConfig}
        onRequestSort={handleRequestSort}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        handleUpdatePayment={handleUpdatePayment}
        handleDeletePayment={handleDeletePayment}
        PaymentForm={PaymentForm}
        showActions={true}
      />
    </div>
  );
};

export default Payments;
