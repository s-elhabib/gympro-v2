import React from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { type MemberFormValues } from "../lib/validations/member";
import { supabase } from "../lib/supabase";
import MemberForm from "../components/MemberForm";
import { searchByFullName } from "../lib/utils";
import SimpleMembersList from "../components/SimpleMembersList";

const ITEMS_PER_PAGE = 20; // Number of items to load at once

const Members = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [members, setMembers] = React.useState<any[]>([]);
  const [visibleMembers, setVisibleMembers] = React.useState<any[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [allMembersLoaded, setAllMembersLoaded] = React.useState(false);

  // Reference to all filtered members for infinite scrolling
  const [allFilteredMembers, setAllFilteredMembers] = React.useState<any[]>([]);

  // Track the current page for loading more items
  const [currentPage, setCurrentPage] = React.useState(0);

  // Initial fetch to get all members
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setCurrentPage(0);
      setVisibleMembers([]);

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMembers(data || []);
      filterMembers(data || [], searchTerm);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Échec de la récupération des membres");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members based on search term
  const filterMembers = (membersData: any[], term: string) => {
    const filtered = membersData.filter(
      (member) =>
        searchByFullName(term, member.first_name, member.last_name) ||
        member.email.toLowerCase().includes(term.toLowerCase())
    );

    // Store all filtered members for infinite scrolling
    setAllFilteredMembers(filtered);
    setAllMembersLoaded(true);

    // Load initial batch
    const initialItems = filtered.slice(0, ITEMS_PER_PAGE);
    setVisibleMembers(initialItems);

    // Set hasNextPage based on whether there are more items to load
    setHasNextPage(filtered.length > ITEMS_PER_PAGE);
  };

  // Update filtered members when search term changes
  React.useEffect(() => {
    filterMembers(members, searchTerm);
  }, [searchTerm, members]);

  // Initial fetch
  React.useEffect(() => {
    fetchMembers();
  }, []);

  // Load more items for infinite scrolling
  const loadMoreItems = async () => {
    if (!hasNextPage || !allMembersLoaded) return Promise.resolve();

    return new Promise<void>((resolve) => {
      // Simulate a delay to show loading indicator
      setTimeout(() => {
        const nextPage = currentPage + 1;
        const startIndex = nextPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        // Get the next batch of items
        const newItems = allFilteredMembers.slice(startIndex, endIndex);

        if (newItems.length > 0) {
          // Append new items to the current list
          setVisibleMembers((prev) => [...prev, ...newItems]);
          setCurrentPage(nextPage);

          // Check if we've loaded all items
          setHasNextPage(endIndex < allFilteredMembers.length);
        } else {
          setHasNextPage(false);
        }

        resolve();
      }, 500); // Small delay for better UX
    });
  };

  // No mapping function needed

  const handleCreateMember = async (data: MemberFormValues) => {
    try {
      const { error } = await supabase.from("members").insert([
        {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          membership_type: data.membershipType,
          start_date: data.startDate.toISOString(),
          status: data.status,
          notes: data.notes || null,
        },
      ]);

      if (error) throw error;

      await fetchMembers();
      setIsAddDialogOpen(false);
      toast.success("Membre créé avec succès");
    } catch (error) {
      console.error("Error creating member:", error);
      toast.error("Échec de la création du membre");
    }
  };

  const handleEditMember = async (data: MemberFormValues) => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          membership_type: data.membershipType,
          start_date: data.startDate.toISOString(),
          status: data.status,
          notes: data.notes || null,
        })
        .eq("id", selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      toast.success("Membre mis à jour avec succès");
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Échec de la mise à jour du membre");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast.success("Membre supprimé avec succès");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Échec de la suppression du membre");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Membres</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Membre</DialogTitle>
                <DialogDescription>
                  Remplissez les détails du membre ci-dessous.
                </DialogDescription>
              </DialogHeader>
              <MemberForm onSubmit={handleCreateMember} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher des membres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>

        <SimpleMembersList
          members={visibleMembers}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          loadMoreItems={loadMoreItems}
          isEditDialogOpen={isEditDialogOpen}
          setIsEditDialogOpen={setIsEditDialogOpen}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          handleEditMember={handleEditMember}
          handleDeleteMember={handleDeleteMember}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          MemberForm={MemberForm}
        />
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera
              définitivement le membre et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedMember(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Members;
