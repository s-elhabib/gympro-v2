import React from "react";
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
import { MembershipType } from "../../services/membershipService";

// Membership type options for the dropdown
const MEMBERSHIP_TYPE_OPTIONS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "annual", label: "Annuel" },
  { value: "day_pass", label: "Accès Journalier" },
];

interface MembershipTypesManagerProps {
  membershipTypes: MembershipType[];
  onMembershipTypesChange: (types: MembershipType[]) => void;
  isLoading?: boolean;
}

const MembershipTypesManager: React.FC<MembershipTypesManagerProps> = ({
  membershipTypes,
  onMembershipTypesChange,
  isLoading = false,
}) => {
  // Add a new membership type (only to local state)
  const handleAddMembershipType = () => {
    const newType: MembershipType = {
      // Use a temporary negative ID to identify new items
      id: -Date.now(), // Negative timestamp to ensure uniqueness
      type: "monthly",
      price: 0,
      duration: 30,
    };

    onMembershipTypesChange([...membershipTypes, newType]);
  };

  // Update a membership type (only in local state)
  const handleUpdateMembershipType = (
    index: number,
    field: keyof MembershipType,
    value: string | number
  ) => {
    const updatedTypes = [...membershipTypes];
    const typeToUpdate = { ...updatedTypes[index] };

    // Update the field
    if (field === "price" || field === "duration") {
      typeToUpdate[field] =
        typeof value === "string" ? parseFloat(value) || 0 : value;
    } else {
      typeToUpdate[field] = value as string;
    }

    // Update locally
    updatedTypes[index] = typeToUpdate;
    onMembershipTypesChange(updatedTypes);
  };

  // Delete a membership type (only from local state)
  const handleDeleteMembershipType = (index: number) => {
    const updatedTypes = [...membershipTypes];
    updatedTypes.splice(index, 1);
    onMembershipTypesChange(updatedTypes);
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
                onClick={() => handleDeleteMembershipType(index)}
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
                    onChange={(e) =>
                      handleUpdateMembershipType(index, "type", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleUpdateMembershipType(index, "price", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleUpdateMembershipType(
                        index,
                        "duration",
                        e.target.value
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddMembershipType}>
            Ajouter un Type d'Abonnement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipTypesManager;
