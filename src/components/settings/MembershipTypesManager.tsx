import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useNotifications } from "../../context/NotificationContext";
import {
  MembershipType,
  fetchMembershipTypes,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
  createDefaultMembershipTypes,
} from "../../services/membershipService";

// Membership type options for the dropdown
const MEMBERSHIP_TYPE_OPTIONS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "annual", label: "Annuel" },
  { value: "day_pass", label: "Accès Journalier" },
];

const MembershipTypesManager: React.FC = () => {
  const { addNotification } = useNotifications();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch membership types on component mount
  useEffect(() => {
    const loadMembershipTypes = async () => {
      setIsLoading(true);
      try {
        // Try to fetch existing membership types
        const types = await fetchMembershipTypes();
        
        // If no types exist, create default ones
        if (types.length === 0) {
          const defaultTypes = await createDefaultMembershipTypes();
          setMembershipTypes(defaultTypes);
        } else {
          setMembershipTypes(types);
        }
      } catch (error) {
        console.error("Error loading membership types:", error);
        addNotification({
          title: "Erreur",
          message: "Échec du chargement des types d'abonnement.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMembershipTypes();
  }, [addNotification]);

  // Add a new membership type
  const handleAddMembershipType = async () => {
    const newType = {
      type: "monthly",
      price: 0,
      duration: 30,
    };

    setIsSaving(true);
    try {
      const createdType = await createMembershipType(newType);
      if (createdType) {
        setMembershipTypes([...membershipTypes, createdType]);
        addNotification({
          title: "Succès",
          message: "Type d'abonnement ajouté avec succès.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error adding membership type:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de l'ajout du type d'abonnement.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update a membership type
  const handleUpdateMembershipType = async (
    index: number,
    field: keyof MembershipType,
    value: string | number
  ) => {
    const updatedTypes = [...membershipTypes];
    const typeToUpdate = { ...updatedTypes[index] };

    // Update the field
    if (field === "price" || field === "duration") {
      typeToUpdate[field] = typeof value === "string" ? parseFloat(value) || 0 : value;
    } else {
      typeToUpdate[field] = value as string;
    }

    // Update locally first for immediate UI feedback
    updatedTypes[index] = typeToUpdate;
    setMembershipTypes(updatedTypes);

    // Then update in the database
    if (typeToUpdate.id) {
      try {
        await updateMembershipType(typeToUpdate.id, {
          [field]: typeToUpdate[field],
        });
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        // Revert to original if there's an error
        const originalTypes = await fetchMembershipTypes();
        setMembershipTypes(originalTypes);
        addNotification({
          title: "Erreur",
          message: `Échec de la mise à jour du type d'abonnement.`,
          type: "error",
        });
      }
    }
  };

  // Delete a membership type
  const handleDeleteMembershipType = async (id: number | undefined, index: number) => {
    if (!id) return;

    try {
      const success = await deleteMembershipType(id);
      if (success) {
        const updatedTypes = [...membershipTypes];
        updatedTypes.splice(index, 1);
        setMembershipTypes(updatedTypes);
        addNotification({
          title: "Succès",
          message: "Type d'abonnement supprimé avec succès.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error deleting membership type:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la suppression du type d'abonnement.",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return <div>Chargement des types d'abonnement...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Types d'Abonnement</CardTitle>
        <CardDescription>
          Configurer les types d'abonnement disponibles pour vos membres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 mt-2">
          {membershipTypes.map((membership, index) => (
            <div
              key={membership.id || index}
              className="relative border border-gray-200 rounded-md p-3"
            >
              {/* X button in top right corner */}
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl p-1 rounded-full hover:bg-red-50 focus:outline-none"
                onClick={() => handleDeleteMembershipType(membership.id, index)}
                aria-label="Supprimer"
                title="Supprimer"
              >
                ×
              </button>

              {/* Three inputs in a row, each taking full width in its column */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label
                    htmlFor={`membership_type_${index}`}
                    className="text-xs"
                  >
                    Type
                  </Label>
                  <select
                    id={`membership_type_${index}`}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={membership.type}
                    onChange={(e) => handleUpdateMembershipType(index, "type", e.target.value)}
                  >
                    {MEMBERSHIP_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label
                    htmlFor={`membership_price_${index}`}
                    className="text-xs"
                  >
                    Prix
                  </Label>
                  <Input
                    id={`membership_price_${index}`}
                    type="number"
                    min="0"
                    value={membership.price}
                    onChange={(e) => handleUpdateMembershipType(index, "price", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label
                    htmlFor={`membership_duration_${index}`}
                    className="text-xs"
                  >
                    Durée (jours)
                  </Label>
                  <Input
                    id={`membership_duration_${index}`}
                    type="number"
                    min="1"
                    value={membership.duration}
                    onChange={(e) => handleUpdateMembershipType(index, "duration", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddMembershipType}
            disabled={isSaving}
          >
            {isSaving ? "Ajout en cours..." : "Ajouter un Type d'Abonnement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipTypesManager;
