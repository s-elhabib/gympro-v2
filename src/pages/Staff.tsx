import React from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash,
  SlidersHorizontal,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { StaffFormValues } from '../lib/validations/staff';
import StaffForm from '../components/StaffForm';

const ITEMS_PER_PAGE = 10;

const Staff = () => {
  const { addNotification } = useNotifications();
  const [staff, setStaff] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [currentStaff, setCurrentStaff] = React.useState<any>(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading staff from database
      // In a real app, this would fetch from supabase
      setTimeout(() => {
        const dummyStaff = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john.smith@example.com',
            phone: '(123) 456-7890',
            role: 'admin',
            hire_date: '2022-03-15',
            status: 'active',
            notes: 'General manager with full system access'
          },
          {
            id: '2',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah.j@example.com',
            phone: '(123) 456-7891',
            role: 'trainer',
            hire_date: '2022-05-20',
            status: 'active',
            notes: 'Specializes in strength training'
          },
          {
            id: '3',
            first_name: 'Michael',
            last_name: 'Davis',
            email: 'michael.d@example.com',
            phone: '(123) 456-7892',
            role: 'receptionist',
            hire_date: '2022-06-10',
            status: 'on_leave',
            notes: 'On maternity leave until August 2023'
          },
          {
            id: '4',
            first_name: 'Jessica',
            last_name: 'Williams',
            email: 'jessica.w@example.com',
            phone: '(123) 456-7893',
            role: 'trainer',
            hire_date: '2022-07-05',
            status: 'active',
            notes: 'Specializes in yoga and pilates'
          },
          {
            id: '5',
            first_name: 'David',
            last_name: 'Brown',
            email: 'david.b@example.com',
            phone: '(123) 456-7894',
            role: 'maintenance',
            hire_date: '2022-08-15',
            status: 'inactive',
            notes: 'Former maintenance staff'
          }
        ];
        
        setStaff(dummyStaff);
        setTotalRecords(dummyStaff.length);
        setIsLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Error fetching staff:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to fetch staff data',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(member => 
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);

  const handleAddStaff = async (data: StaffFormValues) => {
    try {
      // In a real app, you would save to supabase
      const newStaff = {
        id: (staff.length + 1).toString(),
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        hire_date: data.hireDate.toISOString().split('T')[0],
        status: data.status,
        notes: data.notes || ''
      };
      
      setStaff([newStaff, ...staff]);
      setTotalRecords(prev => prev + 1);
      setIsAddDialogOpen(false);
      
      addNotification({
        title: 'Success',
        message: 'Staff member added successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to add staff member',
        type: 'error'
      });
    }
  };

  const handleEditStaff = async (data: StaffFormValues) => {
    try {
      if (!currentStaff) return;
      
      // In a real app, you would update in supabase
      const updatedStaff = {
        ...currentStaff,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        hire_date: data.hireDate.toISOString().split('T')[0],
        status: data.status,
        notes: data.notes || ''
      };
      
      setStaff(staff.map(s => s.id === currentStaff.id ? updatedStaff : s));
      setIsEditDialogOpen(false);
      setCurrentStaff(null);
      
      addNotification({
        title: 'Success',
        message: 'Staff member updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update staff member',
        type: 'error'
      });
    }
  };

  const handleDeleteStaff = async () => {
    try {
      if (!currentStaff) return;
      
      // In a real app, you would delete from supabase
      setStaff(staff.filter(s => s.id !== currentStaff.id));
      setTotalRecords(prev => prev - 1);
      setIsDeleteDialogOpen(false);
      setCurrentStaff(null);
      
      addNotification({
        title: 'Success',
        message: 'Staff member deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete staff member',
        type: 'error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'on_leave':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on_leave':
        return 'On Leave';
      default:
        return status;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter the details of the new staff member below.
              </DialogDescription>
            </DialogHeader>
            <StaffForm onSubmit={handleAddStaff} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex items-center max-w-md">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {`${member.first_name} ${member.last_name}`}
                  </TableCell>
                  <TableCell className="capitalize">{member.role.replace('_', ' ')}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{format(new Date(member.hire_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(member.status)}
                      <span className="capitalize">{getStatusText(member.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setCurrentStaff(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setCurrentStaff(member);
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredStaff.length)} of {filteredStaff.length} staff members
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the staff member's information.
            </DialogDescription>
          </DialogHeader>
          {currentStaff && (
            <StaffForm 
              defaultValues={{
                firstName: currentStaff.first_name,
                lastName: currentStaff.last_name,
                email: currentStaff.email,
                phone: currentStaff.phone,
                role: currentStaff.role,
                hireDate: new Date(currentStaff.hire_date),
                status: currentStaff.status,
                notes: currentStaff.notes
              }}
              onSubmit={handleEditStaff}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the staff member's record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Staff;