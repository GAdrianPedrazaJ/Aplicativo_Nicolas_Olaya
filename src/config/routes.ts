import { UserRole } from '../constants/roles';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  History,
  UploadCloud,
  List,
  Trash2
} from 'lucide-react';

export interface RouteConfig {
  id: string;
  label: string;
  path: string;
  icon: any;
  requiredRoles: UserRole[];
}

export const ROUTES: RouteConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: ['ADMIN', 'MONITOR', 'OPERARIO', 'SUPERADMIN'],
  },
  {
    id: 'siembras',
    label: 'Siembras',
    path: '/siembras/lista',
    icon: List,
    requiredRoles: ['ADMIN', 'MONITOR', 'SUPERADMIN'],
  },
  {
    id: 'carga-historicos',
    label: 'Carga de Históricos',
    path: '/siembras/historicos',
    icon: History,
    requiredRoles: ['ADMIN', 'MONITOR', 'SUPERADMIN'],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/reportes',
    icon: FileText,
    requiredRoles: ['ADMIN', 'MONITOR', 'SUPERADMIN'],
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    path: '/usuarios',
    icon: Users,
    requiredRoles: ['SUPERADMIN'],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    path: '/configuracion',
    icon: Settings,
    requiredRoles: ['ADMIN', 'SUPERADMIN'],
  },
];

export const SIEMBRAS_SUBROUTES = [
  {
    id: 'lista-siembras',
    label: 'Ver Siembras',
    path: '/siembras/lista',
    icon: List,
  },
  {
    id: 'carga-siembras',
    label: 'Cargar Siembras',
    path: '/siembras/cargar',
    icon: UploadCloud,
  },
  {
    id: 'eliminar-siembras',
    label: 'Eliminación de Siembras',
    path: '/siembras/eliminar',
    icon: Trash2,
  },
];
