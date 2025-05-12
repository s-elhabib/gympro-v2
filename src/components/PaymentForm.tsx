import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { format, addMonths, isValid } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  paymentSchema,
  type PaymentFormValues,
} from "../lib/validations/payment";
import { supabase } from "../lib/supabase";
import MemberSearch from "./MemberSearch";
import { useNotifications } from "../context/NotificationContext";
import { MembershipType, fetchMembershipTypes } from "../services/membershipService";

export const PaymentForm = ({
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
  const [selectedTypePrice, setSelectedTypePrice] = useState<number>(0);
  const [currentAmount, setCurrentAmount] = useState<number>(defaultValues?.amount || 0);
  const [amountInputValue, setAmountInputValue] = useState<string>(defaultValues?.amount ? String(defaultValues.amount) : '');

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      memberId: "",
      membershipType: "monthly", // Default to monthly
      amount: 0,
      paymentDate: new Date(),
      dueDate: new Date(),
      status: "paid", // Default to paid
      paymentMethod: "cash",
      notes: "",
      ...defaultValues,
    },
  });

  // Load membership types on component mount
  useEffect(() => {
    const loadMembershipTypes = async () => {
      setIsLoadingMembershipTypes(true);
      try {
        const types = await fetchMembershipTypes();
        setMembershipTypes(types);

        // If no membership type is selected yet, default to "monthly"
        if (!selectedMemberType && !defaultValues?.membershipType) {
          const monthlyType = types.find(t => t.type === "monthly");
          if (monthlyType) {
            setSelectedMemberType("monthly");
            form.setValue("membershipType", "monthly");
            setSelectedTypePrice(monthlyType.price);
            form.setValue("amount", monthlyType.price);
            setCurrentAmount(monthlyType.price);
            setAmountInputValue(String(monthlyType.price));
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
  }, [addNotification, form, selectedMemberType, defaultValues]);

  // Update form when selectedMemberType changes
  useEffect(() => {
    if (selectedMemberType && selectedMemberType.trim() !== '') {
      form.setValue("membershipType", selectedMemberType);

      // Find the membership type and update the amount
      const membershipType = membershipTypes.find((t) => t.type === selectedMemberType);
      if (membershipType) {
        setSelectedTypePrice(membershipType.price);
        form.setValue("amount", membershipType.price);
        setCurrentAmount(membershipType.price);
        setAmountInputValue(String(membershipType.price));
      }
    }
  }, [selectedMemberType, membershipTypes, form]);

  // Watch for changes to the amount field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'amount' && typeof value.amount === 'number') {
        setCurrentAmount(value.amount);

        // If amount is less than the selected type price, change status to "pending"
        if (value.amount < selectedTypePrice && value.status === "paid") {
          form.setValue("status", "pending");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, selectedTypePrice]);

  // Format date for input field
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date || !isValid(date)) {
      return format(new Date(), "yyyy-MM-dd");
    }
    return format(date, "yyyy-MM-dd");
  };

  // Handle member selection
  const handleMemberSelect = async (member: { id: string }) => {
    form.setValue("memberId", member.id);

    // Fetch member details to get membership type
    try {
      const { data: memberData, error } = await supabase
        .from("members")
        .select("membership_type")
        .eq("id", member.id)
        .single();

      if (error) throw error;

      if (memberData && memberData.membership_type) {
        handleMembershipTypeChange(memberData.membership_type);
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };

  // Handle membership type change
  const handleMembershipTypeChange = (type: string) => {
    setSelectedMemberType(type);
    form.setValue("membershipType", type);

    // Find the membership type and update the amount
    const membershipType = membershipTypes.find((t) => t.type === type);

    if (membershipType) {
      setSelectedTypePrice(membershipType.price);
      form.setValue("amount", membershipType.price);
      setCurrentAmount(membershipType.price);
      setAmountInputValue(String(membershipType.price));

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

  // Handle adding one month to due date
  const handleAddOneMonth = () => {
    const currentDueDate = form.getValues("dueDate");
    const newDueDate = addMonths(
      currentDueDate instanceof Date ? currentDueDate : new Date(),
      1
    );
    form.setValue("dueDate", newDueDate);
  };

  // Translate membership type to French
  const translateMembershipType = (type: string): string => {
    switch (type) {
      case "monthly":
        return "Mensuel";
      case "quarterly":
        return "Trimestriel";
      case "annual":
        return "Annuel";
      case "day_pass":
        return "Accès Journalier";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
    }
  };

  // Check if amount is sufficient for "paid" status
  const isAmountSufficient = currentAmount >= selectedTypePrice;

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
                            {translateMembershipType(type.type)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {type.price.toFixed(2)} MAD / {type.duration} jours
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
                  type="text"
                  inputMode="decimal"
                  value={amountInputValue}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Update the displayed input value
                    setAmountInputValue(inputValue);

                    // Update the form value and current amount for validation
                    if (inputValue === '' || inputValue === '0') {
                      field.onChange(0);
                      setCurrentAmount(0);
                    } else {
                      const value = parseFloat(inputValue);
                      if (!isNaN(value)) {
                        field.onChange(value);
                        setCurrentAmount(value);
                      }
                    }
                  }}
                />
              </FormControl>
              {currentAmount < selectedTypePrice && (
                <p className="text-xs text-amber-600">
                  Le montant est inférieur au prix du type d'abonnement sélectionné ({selectedTypePrice} MAD)
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select
                onValueChange={(value) => {
                  // If trying to set status to "paid" but amount is insufficient
                  if (value === "paid" && !isAmountSufficient) {
                    // Show warning but don't change the value
                    field.onChange("pending");
                  } else {
                    field.onChange(value);
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="overdue">En Retard</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              {!isAmountSufficient && (
                <p className="text-xs text-amber-600">
                  Le montant est inférieur au prix du type d'abonnement ({selectedTypePrice} MAD).
                  Le statut sera automatiquement défini sur "En Attente".
                </p>
              )}
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
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="credit_card">Carte de Crédit</SelectItem>
                  <SelectItem value="debit_card">Carte de Débit</SelectItem>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {isEditing ? "Mettre à jour le Paiement" : "Enregistrer le Paiement"}
        </Button>
      </form>
    </Form>
  );
};
