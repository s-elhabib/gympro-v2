import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../context/RBACContext';
import { UserRole } from '../types/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { ShieldCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface RoleManagementProps {
  userId: string;
  currentRole: UserRole;
  userName: string;
  trigger?: React.ReactNode;
}

const RoleManagement: React.FC<RoleManagementProps> = ({
  userId,
  currentRole,
  userName,
  trigger
}) => {
  const { updateUserRole } = useAuth();
  const { hasPermission } = useRBAC();
  const { addNotification } = useNotifications();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only admins can change roles
  const canManageRoles = hasPermission('staff:edit');

  if (!canManageRoles) {
    return null;
  }

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setIsOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserRole(userId, selectedRole);
      addNotification({
        title: 'Rôle mis à jour',
        message: `Le rôle de ${userName} a été changé en ${selectedRole}`,
        type: 'success'
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le rôle',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Manager' },
    { value: 'trainer', label: 'Entraîneur' },
    { value: 'receptionist', label: 'Réceptionniste' },
    { value: 'staff', label: 'Personnel' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Gérer le Rôle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer le Rôle Utilisateur</DialogTitle>
          <DialogDescription>
            Modifier le rôle de {userName}. Cela changera les permissions de l'utilisateur dans le système.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rôle Actuel</label>
            <div className="px-3 py-2 border rounded-md bg-gray-50">
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau Rôle</label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleRoleChange} 
            disabled={isSubmitting || selectedRole === currentRole}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le Rôle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleManagement;
