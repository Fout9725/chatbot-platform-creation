import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Permission = 
  | 'view_stats'
  | 'manage_users'
  | 'manage_pricing'
  | 'manage_templates'
  | 'manage_bots'
  | 'manage_docs'
  | 'manage_marketplace'
  | 'upload_files'
  | 'delete_users'
  | 'view_payments';

export type Role = 'admin' | 'moderator' | 'support' | 'user';

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'view_stats',
    'manage_users',
    'manage_pricing',
    'manage_templates',
    'manage_bots',
    'manage_docs',
    'manage_marketplace',
    'upload_files',
    'delete_users',
    'view_payments'
  ],
  moderator: [
    'view_stats',
    'manage_templates',
    'manage_bots',
    'manage_marketplace',
    'upload_files'
  ],
  support: [
    'view_stats',
    'manage_users'
  ],
  user: []
};

interface PermissionsContextType {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  userRole: Role;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const userRole: Role = (user?.role as Role) || 'user';
  const userPermissions = rolePermissions[userRole];

  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => userPermissions.includes(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => userPermissions.includes(p));
  };

  return (
    <PermissionsContext.Provider value={{ hasPermission, hasAnyPermission, hasAllPermissions, userRole }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
