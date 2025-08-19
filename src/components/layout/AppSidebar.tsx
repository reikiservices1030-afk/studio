
'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Bot,
  Bell,
  LogOut,
  Settings,
  Euro,
  Building,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

const AppSidebar = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const navItems = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/tenants', label: 'Locataires', icon: Users },
    { href: '/properties', label: 'Propriétés', icon: Building },
    { href: '/payments', label: 'Paiements', icon: Euro },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/reminders', label: 'Rappels', icon: Bell },
    { href: '/reports', label: 'Rapports', icon: BarChart3 },
    { href: '/analysis', label: 'Analyse IA', icon: Bot },
    { href: '/indexing', label: 'Indexation', icon: TrendingUp },
  ];

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Home className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">BelgoRent</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  onClick={handleLinkClick}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Paramètres" isActive={pathname === '/settings'} onClick={handleLinkClick}>
                  <Link href="/settings">
                    <Settings />
                    <span>Paramètres</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Déconnexion" onClick={handleLinkClick}>
                  <Link href="#">
                    <LogOut />
                    <span>Déconnexion</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
