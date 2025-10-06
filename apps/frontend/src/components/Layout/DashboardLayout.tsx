'use client';

import { useState, ReactNode } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PrecisionManufacturing as MachineIcon,
  Build as MaintenanceIcon,
  Description as DocumentIcon,
  Category as CategoryIcon,
  Label as TypeIcon,
  People as UsersIcon,
  Schedule as ScheduledIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import UserAvatar from '@/components/UserAvatar';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuthStore } from '@/store/authStore';

const DRAWER_WIDTH = 280;

interface NavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: string[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    label: 'Macchinari',
    href: '/machines',
    icon: <MachineIcon />,
  },
  {
    label: 'Manutenzioni',
    href: '/maintenances',
    icon: <MaintenanceIcon />,
  },
  {
    label: 'Documenti',
    href: '/documents',
    icon: <DocumentIcon />,
  },
  {
    label: 'Manutenzioni Programmate',
    href: '/scheduled-maintenances',
    icon: <ScheduledIcon />,
  },
  {
    label: 'Categorie',
    href: '/categories',
    icon: <CategoryIcon />,
    roles: ['admin'],
  },
  {
    label: 'Tipi',
    href: '/types',
    icon: <TypeIcon />,
    roles: ['admin'],
  },
  {
    label: 'Utenti',
    href: '/users',
    icon: <UsersIcon />,
    roles: ['admin'],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleItemClick = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const handleExpandClick = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const filterNavItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter((item) => {
      if (item.roles && item.roles.length > 0) {
        return hasRole(item.roles as any);
      }
      return true;
    });
  };

  const renderNavItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = isItemActive(item.href);

    return (
      <Box key={item.label}>
        <ListItemButton
          onClick={() => {
            if (hasChildren) {
              handleExpandClick(item.label);
            } else {
              handleItemClick(item.href);
            }
          }}
          selected={isActive && !hasChildren}
          sx={{
            py: 1.25,
            px: 2,
            mb: 0.5,
            mx: 1,
            borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
            }}
          />
          {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => (
                <ListItemButton
                  key={child.label}
                  onClick={() => handleItemClick(child.href)}
                  selected={isItemActive(child.href)}
                  sx={{
                    py: 1,
                    pl: 7,
                    pr: 2,
                    mb: 0.5,
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={child.label}
                    primaryTypographyProps={{
                      fontSize: '0.813rem',
                      fontWeight: isItemActive(child.href) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Logo />
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List>{filterNavItems(navigationItems).map(renderNavItem)}</List>
      </Box>
      <Divider />
      {user && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={handleUserMenuOpen}
        >
          <UserAvatar user={user} size={40} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.role}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
            <GlobalSearch />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
