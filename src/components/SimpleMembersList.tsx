import React, { useRef } from 'react';
import { Edit, MoreVertical, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { MemberFormValues } from '../lib/validations/member';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  membership_type: string;
  start_date: string;
  status: string;
  notes: string | null;
}

interface SimpleMembersListProps {
  members: Member[];
  isLoading: boolean;
  hasNextPage: boolean;
  loadMoreItems: () => Promise<void>;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;
  handleEditMember: (data: MemberFormValues) => Promise<void>;
  handleDeleteMember: () => Promise<void>;
  setIsDeleteDialogOpen: (open: boolean) => void;
  MemberForm: React.ComponentType<{
    defaultValues?: Partial<MemberFormValues>;
    onSubmit: (data: MemberFormValues) => void;
    isEditing?: boolean;
  }>;
}

const SimpleMembersList: React.FC<SimpleMembersListProps> = ({
  members,
  isLoading,
  hasNextPage,
  loadMoreItems,
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedMember,
  setSelectedMember,
  handleEditMember,
  handleDeleteMember,
  setIsDeleteDialogOpen,
  MemberForm,
}) => {
  const navigate = useNavigate();
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  React.useEffect(() => {
    if (!hasNextPage || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          setIsLoadingMore(true);
          loadMoreItems().finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasNextPage, loadMoreItems, isLoadingMore]);

  if (isLoading && members.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        Aucun membre trouvé
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[800px] px-4 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{`${member.first_name} ${member.last_name}`}</TableCell>
                  <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{member.phone}</TableCell>
                  <TableCell className="capitalize">
                    {member.membership_type === "basic" ? "Mensuel" :
                     member.membership_type === "premium" ? "Trimestriel" :
                     member.membership_type === "platinum" ? "Annuel" :
                     member.membership_type === "monthly" ? "Mensuel" :
                     member.membership_type === "quarterly" ? "Trimestriel" :
                     member.membership_type === "annual" ? "Annuel" :
                     member.membership_type === "day_pass" ? "Accès Journalier" :
                     member.membership_type}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' :
                      member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {member.status === 'active' ? 'Actif' :
                       member.status === 'inactive' ? 'Inactif' :
                       'Suspendu'}
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
                        Voir
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
                            Voir
                          </DropdownMenuItem>
                          <Dialog open={isEditDialogOpen && selectedMember?.id === member.id} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                                setSelectedMember(member);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {selectedMember && selectedMember.id === member.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier le Membre</DialogTitle>
                                  <DialogDescription>
                                    Mettez à jour les détails du membre ci-dessous.
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
                            className="text-amber-600"
                            onSelect={(e) => {
                              e.preventDefault();
                              setSelectedMember(member);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {hasNextPage && (
        <div
          ref={loaderRef}
          className="flex justify-center items-center p-4"
        >
          {isLoadingMore ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <Button
              variant="outline"
              onClick={() => loadMoreItems()}
            >
              Charger plus
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleMembersList;
