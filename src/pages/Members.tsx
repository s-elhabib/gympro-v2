import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, MoreVertical, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { memberSchema, type MemberFormValues } from '../lib/validations/member';
import { supabase } from '../lib/supabase';
import MemberForm from '../components/MemberForm';
import { searchByFullName } from '../lib/utils';

const Members = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [members, setMembers] = React.useState<any[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error("Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateMember = async (data: MemberFormValues) => {
    try {
      const { error } = await supabase.from('members').insert([{
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        membership_type: data.membershipType,
        start_date: data.startDate.toISOString(),
        status: data.status,
        notes: data.notes || null
      }]);

      if (error) throw error;

      await fetchMembers();
      setIsAddDialogOpen(false);
      toast.success("Member created successfully");
    } catch (error) {
      console.error('Error creating member:', error);
      toast.error("Failed to create member");
    }
  };

  const handleEditMember = async (data: MemberFormValues) => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          membership_type: data.membershipType,
          start_date: data.startDate.toISOString(),
          status: data.status,
          notes: data.notes || null
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      toast.success("Member updated successfully");
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error("Failed to update member");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast.success("Member deleted successfully");
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error("Failed to delete member");
    }
  };

  const filteredMembers = members.filter(member => 
    searchByFullName(searchTerm, member.first_name, member.last_name) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Fill in the member details below.
                </DialogDescription>
              </DialogHeader>
              <MemberForm onSubmit={handleCreateMember} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] px-4 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
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
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{`${member.first_name} ${member.last_name}`}</TableCell>
                        <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{member.phone}</TableCell>
                        <TableCell className="capitalize">{member.membership_type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.status === 'active' ? 'bg-green-100 text-green-800' :
                            member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/members/${member.id}`)}
                              className="hidden sm:inline-flex"
                            >
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="sm:hidden"
                                  onClick={() => navigate(`/members/${member.id}`)}
                                >
                                  View
                                </DropdownMenuItem>
                                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => {
                                      e.preventDefault();
                                      setSelectedMember(member);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  {selectedMember && (
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Member</DialogTitle>
                                        <DialogDescription>
                                          Update member details below.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <MemberForm
                                        defaultValues={{
                                          firstName: selectedMember.first_name,
                                          lastName: selectedMember.last_name,
                                          email: selectedMember.email,
                                          phone: selectedMember.phone,
                                          membershipType: selectedMember.membership_type,
                                          startDate: new Date(selectedMember.start_date),
                                          status: selectedMember.status,
                                          notes: selectedMember.notes || ''
                                        }}
                                        onSubmit={handleEditMember}
                                        isEditing
                                      />
                                    </DialogContent>
                                  )}
                                </Dialog>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedMember(member);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
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
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedMember(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Members;