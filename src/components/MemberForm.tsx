import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberFormValues } from "../lib/validations/member";
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
import { Loader2 } from "lucide-react";
import {
  fetchMembershipTypes,
  type MembershipType,
} from "../services/membershipService";

// Helper function to get a human-readable label for membership types
const getMembershipTypeLabel = (type: string): string => {
  switch (type) {
    case "monthly":
    case "basic": // Map old enum value to new type
      return "Mensuel";
    case "quarterly":
    case "premium": // Map old enum value to new type
      return "Trimestriel";
    case "annual":
    case "platinum": // Map old enum value to new type
      return "Annuel";
    case "day_pass":
      return "Accès Journalier";
    default:
      // For custom types, just capitalize the first letter and replace underscores with spaces
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }
};

// Helper function to map old enum values to new membership types
const mapOldEnumToNewType = (oldType: string): string => {
  switch (oldType) {
    case "basic":
      return "monthly";
    case "premium":
      return "quarterly";
    case "platinum":
      return "annual";
    default:
      return oldType;
  }
};

// Helper function to map new membership types to old enum values
// Now that we've changed the database column to text, we don't need to map to enum values
const mapNewTypeToOldEnum = (newType: string): string => {
  // Just return the new type as is - no mapping needed
  return newType;
};

interface MemberFormProps {
  defaultValues?: Partial<MemberFormValues>;
  onSubmit: (data: MemberFormValues) => void;
  isEditing?: boolean;
}

const MemberForm = ({
  defaultValues,
  onSubmit,
  isEditing = false,
}: MemberFormProps) => {
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch membership types on component mount
  useEffect(() => {
    const loadMembershipTypes = async () => {
      setIsLoading(true);
      try {
        const types = await fetchMembershipTypes();

        // Remove duplicates by type (keep the one with the highest ID)
        const uniqueTypes = types.reduce((acc, current) => {
          const existingTypeIndex = acc.findIndex(
            (item) => item.type === current.type
          );

          if (existingTypeIndex === -1) {
            // Type doesn't exist in accumulator, add it
            acc.push(current);
          } else if (
            current.id &&
            acc[existingTypeIndex].id &&
            current.id > acc[existingTypeIndex].id
          ) {
            // Type exists and current item has a higher ID, replace it
            acc[existingTypeIndex] = current;
          }

          return acc;
        }, [] as MembershipType[]);

        // No longer adding legacy membership types

        setMembershipTypes(uniqueTypes);
      } catch (error) {
        console.error("Error loading membership types:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembershipTypes();
  }, []);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      membershipType: defaultValues?.membershipType || "",
      startDate: new Date(),
      status: "active",
      notes: "",
      ...defaultValues,
    },
  });

  // Update the form's default value for membershipType when membershipTypes are loaded
  useEffect(() => {
    if (membershipTypes.length > 0) {
      // If we have a default value, map it from old enum to new type for display
      if (defaultValues?.membershipType) {
        const mappedType = mapOldEnumToNewType(defaultValues.membershipType);
        // Check if the mapped type exists in our membership types
        const typeExists = membershipTypes.some(t => t.type === mappedType);
        if (typeExists) {
          // For display purposes only - we'll convert back when submitting
          form.setValue("membershipType", mappedType);
        } else {
          // If the mapped type doesn't exist, use the first available type
          form.setValue("membershipType", membershipTypes[0].type);
        }
      } else if (!form.getValues("membershipType")) {
        // If no default value, use the first available type
        form.setValue("membershipType", membershipTypes[0].type);
      }
    }
  }, [membershipTypes, form, defaultValues]);

  const handleSubmit = (data: MemberFormValues) => {
    // Map the selected membership type back to the enum value expected by the database
    const mappedData = {
      ...data,
      membershipType: mapNewTypeToOldEnum(data.membershipType)
    };
    onSubmit(mappedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
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
              <FormLabel>Type d'Abonnement</FormLabel>
              {isLoading ? (
                <div className="flex items-center space-x-2 h-10 px-3 py-2 border border-input rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Chargement des types d'abonnement...
                  </span>
                </div>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type d'abonnement">
                        {field.value && (
                          <div>{getMembershipTypeLabel(field.value)}</div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {membershipTypes.length === 0 ? (
                      <SelectItem value="" disabled>
                        Aucun type d'abonnement disponible
                      </SelectItem>
                    ) : (
                      // Filter out any old enum values that might have been added
                      membershipTypes
                        .filter(type => !["basic", "premium", "platinum"].includes(type.type))
                        .map((type) => (
                          <SelectItem key={type.id} value={type.type}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getMembershipTypeLabel(type.type)}
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
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
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
          {isEditing ? "Mettre à Jour le Membre" : "Enregistrer le Membre"}
        </Button>
      </form>
    </Form>
  );
};

export default MemberForm;
