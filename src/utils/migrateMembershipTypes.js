import { supabase } from "../lib/supabase";

/**
 * Migrates members with old membership types (basic, premium, platinum) to new types
 * @returns {Promise<{success: boolean, message: string, updated: number}>}
 */
export const migrateMembershipTypes = async () => {
  try {
    console.log("Starting membership type migration...");
    
    // First, fetch all membership types to get the new types
    const { data: membershipTypes, error: typesError } = await supabase
      .from("membership_types")
      .select("*");
      
    if (typesError) {
      console.error("Error fetching membership types:", typesError);
      return { 
        success: false, 
        message: "Failed to fetch membership types", 
        updated: 0 
      };
    }
    
    if (!membershipTypes || membershipTypes.length === 0) {
      console.error("No membership types found");
      return { 
        success: false, 
        message: "No membership types found", 
        updated: 0 
      };
    }
    
    // Find the monthly, quarterly, and annual types
    const monthlyType = membershipTypes.find(t => t.type === "monthly");
    const quarterlyType = membershipTypes.find(t => t.type === "quarterly");
    const annualType = membershipTypes.find(t => t.type === "annual");
    
    if (!monthlyType || !quarterlyType || !annualType) {
      console.error("Missing required membership types");
      return { 
        success: false, 
        message: "Missing required membership types (monthly, quarterly, or annual)", 
        updated: 0 
      };
    }
    
    // Fetch all members with old membership types
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, membership_type")
      .in("membership_type", ["basic", "premium", "platinum"]);
      
    if (membersError) {
      console.error("Error fetching members:", membersError);
      return { 
        success: false, 
        message: "Failed to fetch members", 
        updated: 0 
      };
    }
    
    console.log(`Found ${members.length} members with old membership types`);
    
    // Update each member with the appropriate new membership type
    let updatedCount = 0;
    
    for (const member of members) {
      let newType;
      
      // Map old types to new types
      if (member.membership_type === "basic") {
        newType = monthlyType.type;
      } else if (member.membership_type === "premium") {
        newType = quarterlyType.type;
      } else if (member.membership_type === "platinum") {
        newType = annualType.type;
      }
      
      if (newType) {
        const { error: updateError } = await supabase
          .from("members")
          .update({ membership_type: newType })
          .eq("id", member.id);
          
        if (updateError) {
          console.error(`Error updating member ${member.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated member ${member.id} from ${member.membership_type} to ${newType}`);
        }
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} members.`);
    
    return { 
      success: true, 
      message: `Successfully migrated ${updatedCount} members to new membership types`, 
      updated: updatedCount 
    };
  } catch (error) {
    console.error("Error in migrateMembershipTypes:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred", 
      updated: 0 
    };
  }
};
