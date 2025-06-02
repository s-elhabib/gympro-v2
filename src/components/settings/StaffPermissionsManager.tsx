import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { ROLE_PERMISSIONS, UserRole } from '../../types/auth';
import { clearUserRoleCache, refreshCurrentUserData } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date: string;
}

const StaffPermissionsManager: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, status, hire_date')
        .order('first_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger la liste du personnel',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStaffRole = async (staffId: string, newRole: UserRole) => {
    try {
      // Find the staff member to get their email
      const staffMember = staffMembers.find(staff => staff.id === staffId);

      const { error } = await supabase
        .from('staff')
        .update({ role: newRole })
        .eq('id', staffId);

      if (error) throw error;

      // Clear the cache for this user so they get the new role on next login
      if (staffMember?.email) {
        clearUserRoleCache(staffMember.email);
        console.log('Cleared role cache for user:', staffMember.email);

        // If this is the current user, refresh their auth state immediately
        if (user?.email === staffMember.email) {
          console.log('🔄 Current user role changed, refreshing auth state...');
          await refreshCurrentUserData();
          addNotification({
            title: 'Succès',
            message: 'Votre rôle a été mis à jour. Les nouvelles permissions sont maintenant actives.',
            type: 'success'
          });
        } else {
          addNotification({
            title: 'Succès',
            message: 'Rôle du personnel mis à jour avec succès. L\'utilisateur devra se reconnecter pour voir les changements.',
            type: 'success'
          });
        }
      }

      setStaffMembers(prev =>
        prev.map(staff =>
          staff.id === staffId ? { ...staff, role: newRole } : staff
        )
      );

      setEditingStaff(null);
    } catch (error) {
      console.error('Error updating staff role:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le rôle',
        type: 'error'
      });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'trainer': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'trainer': return 'Entraîneur';
      case 'receptionist': return 'Réceptionniste';
      case 'maintenance': return 'Maintenance';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Permissions du Personnel
          </CardTitle>
          <CardDescription>
            Gérer les rôles et permissions des membres du personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.first_name} {staff.last_name}
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      {editingStaff === staff.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={staff.role}
                            onValueChange={(value: UserRole) => updateStaffRole(staff.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrateur</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="trainer">Entraîneur</SelectItem>
                              <SelectItem value="receptionist">Réceptionniste</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStaff(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge className={getRoleBadgeColor(staff.role)}>
                          {getRoleLabel(staff.role)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                        {staff.status === 'active' ? 'Actif' : 
                         staff.status === 'inactive' ? 'Inactif' : 'En congé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPermissions(
                          showPermissions === staff.id ? null : staff.id
                        )}
                      >
                        {showPermissions === staff.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {editingStaff !== staff.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStaff(staff.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Permissions Details */}
          {showPermissions && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  Permissions - {staffMembers.find(s => s.id === showPermissions)?.first_name} {staffMembers.find(s => s.id === showPermissions)?.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => {
                    const currentStaff = staffMembers.find(s => s.id === showPermissions);
                    if (currentStaff?.role !== role) return null;
                    
                    return permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm capitalize">{permission}</span>
                      </div>
                    ));
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Référence des Permissions par Rôle</CardTitle>
          <CardDescription>
            Aperçu des permissions accordées à chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getRoleBadgeColor(role as UserRole)}>
                    {getRoleLabel(role as UserRole)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {permissions.length} permission(s)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPermissionsManager;
