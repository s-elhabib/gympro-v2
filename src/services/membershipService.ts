import { supabase } from "../lib/supabase";

export interface MembershipType {
  id?: number;
  type: string;
  price: number;
  duration: number;
  created_at?: string;
}

/**
 * Fetch all membership types from the database
 * @returns Array of membership types
 */
export const fetchMembershipTypes = async (): Promise<MembershipType[]> => {
  try {
    const { data, error } = await supabase
      .from("membership_types")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching membership types:", error);
    return [];
  }
};

/**
 * Create a new membership type
 * @param membershipType The membership type to create
 * @returns The created membership type
 */
export const createMembershipType = async (
  membershipType: Omit<MembershipType, "id" | "created_at">
): Promise<MembershipType | null> => {
  try {
    const { data, error } = await supabase
      .from("membership_types")
      .insert([membershipType])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating membership type:", error);
    return null;
  }
};

/**
 * Update an existing membership type
 * @param id The ID of the membership type to update
 * @param membershipType The updated membership type data
 * @returns The updated membership type
 */
export const updateMembershipType = async (
  id: number,
  membershipType: Partial<MembershipType>
): Promise<MembershipType | null> => {
  try {
    const { data, error } = await supabase
      .from("membership_types")
      .update(membershipType)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating membership type:", error);
    return null;
  }
};

/**
 * Delete a membership type
 * @param id The ID of the membership type to delete
 * @returns True if successful, false otherwise
 */
export const deleteMembershipType = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("membership_types")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting membership type:", error);
    return false;
  }
};

/**
 * Create default membership types if none exist
 * @returns Array of created membership types
 */
export const createDefaultMembershipTypes = async (): Promise<MembershipType[]> => {
  try {
    // Check if any membership types exist
    const { data: existingTypes, error: checkError } = await supabase
      .from("membership_types")
      .select("id")
      .limit(1);

    if (checkError) throw checkError;

    // If membership types already exist, return empty array
    if (existingTypes && existingTypes.length > 0) {
      return [];
    }

    // Default membership types
    const defaultTypes = [
      { type: "monthly", price: 0, duration: 30 },
      { type: "quarterly", price: 0, duration: 90 },
      { type: "annual", price: 0, duration: 365 },
      { type: "day_pass", price: 0, duration: 1 },
    ];

    // Insert default types
    const { data, error } = await supabase
      .from("membership_types")
      .insert(defaultTypes)
      .select();

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error creating default membership types:", error);
    return [];
  }
};
