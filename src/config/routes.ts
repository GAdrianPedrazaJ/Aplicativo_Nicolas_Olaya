import { UserRole } from '../constants/roles';
import {
  LayoutDashboard,
  Sprout,
  FileText,
  Users,
  Settings,
  History,
  UploadCloud
} from 'lucide-react';

export interface RouteConfig {
  id: string;
  label: string;
  path: string;
  icon: any;
  component?: string;
  requiredRoles: UserRole[];
  children?: RouteConfig[];
}

export const ROUTES: RouteConfig[] = [
  {
    id: 'dashboard',
    label: 'Inteligencia de Datos',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: ['ADMIN', 'MONITOR', 'OPERARIO', 'SUPERADMIN'],
  },
  {
    id: 'siembras',
    label: 'Siembras',
    path: '/siembras',
    icon: Sprout,
    requiredRoles: ['ADMIN', 'MONITOR', 'SUPERADMIN'],
    children: [
      {
        id: 'carga-siembras',
        label: 'Cargar Siembras',
        path: '/siembras/cargar',
        icon: UploadCloud,
        requiredRoles: ['ADMIN', 'SUPERADMIN'],
      },
      {
        id: 'carga-historicos',
        label: 'Carga de Históricos',
        path: '/siembras/historicos',
        icon: History,
        requiredRoles: ['ADMIN', 'MONITOR', 'SUPERADMIN'],
      },
    ],
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
