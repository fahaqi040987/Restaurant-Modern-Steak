import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/ui/user-menu'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ChefHat,
  Settings,
  Menu,
  BarChart3,
  UserCog,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package
} from 'lucide-react'
import type { User as UserType } from '@/types'

interface AdminSidebarProps {
  user: UserType
}

interface AdminSection {
  id: string
  labelKey: string
  icon: React.ReactNode
  descriptionKey: string
  href: string
}

const adminSections: AdminSection[] = [
  {
    id: 'dashboard',
    labelKey: 'admin.dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    descriptionKey: 'admin.dashboardDescription',
    href: '/admin/dashboard'
  },
  {
    id: 'server',
    labelKey: 'admin.serverInterface',
    icon: <Users className="w-5 h-5" />,
    descriptionKey: 'admin.serverDescription',
    href: '/admin/server'
  },
  {
    id: 'counter',
    labelKey: 'admin.counterCheckout',
    icon: <CreditCard className="w-5 h-5" />,
    descriptionKey: 'admin.counterDescription',
    href: '/admin/counter'
  },
  {
    id: 'kitchen',
    labelKey: 'admin.kitchenDisplay',
    icon: <ChefHat className="w-5 h-5" />,
    descriptionKey: 'admin.kitchenDescription',
    href: '/admin/kitchen'
  },
  {
    id: 'settings',
    labelKey: 'admin.settings',
    icon: <Settings className="w-5 h-5" />,
    descriptionKey: 'admin.settingsDescription',
    href: '/admin/settings'
  },
  {
    id: 'contacts',
    labelKey: 'admin.contactMessages',
    icon: <MessageSquare className="w-5 h-5" />,
    descriptionKey: 'admin.contactDescription',
    href: '/admin/contacts'
  },
  {
    id: 'inventory',
    labelKey: 'admin.inventory',
    icon: <Package className="w-5 h-5" />,
    descriptionKey: 'admin.inventoryDescription',
    href: '/admin/inventory'
  },
  {
    id: 'staff',
    labelKey: 'admin.manageStaff',
    icon: <UserCog className="w-5 h-5" />,
    descriptionKey: 'admin.staffDescription',
    href: '/admin/staff'
  },
  {
    id: 'menu',
    labelKey: 'admin.manageMenu',
    icon: <Menu className="w-5 h-5" />,
    descriptionKey: 'admin.menuDescription',
    href: '/admin/menu'
  },
  {
    id: 'tables',
    labelKey: 'admin.manageTables',
    icon: <LayoutGrid className="w-5 h-5" />,
    descriptionKey: 'admin.tablesDescription',
    href: '/admin/tables'
  },
  {
    id: 'reports',
    labelKey: 'admin.viewReports',
    icon: <BarChart3 className="w-5 h-5" />,
    descriptionKey: 'admin.reportsDescription',
    href: '/admin/reports'
  }
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const { t } = useTranslation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const location = useLocation()

  // Responsive checks
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)

      if (width < 1024) {
        setSidebarCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const isActiveRoute = (href: string) => {
    return location.pathname === href
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {(isMobile || isTablet) && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`bg-card border-r border-border transition-all duration-300 flex flex-col z-50 ${
        (isMobile || isTablet) 
          ? `fixed left-0 top-0 h-full ${sidebarCollapsed ? '-translate-x-full w-0' : 'translate-x-0 w-80'}` 
          : `relative ${sidebarCollapsed ? 'w-16' : 'w-64'}`
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">{t('admin.panelTitle')}</h1>
                  <p className="text-xs text-muted-foreground">{t('admin.restaurantManagement')}</p>
                </div>
              </div>
            )}
            
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? 
                <ChevronRight className="h-4 w-4" /> : 
                <ChevronLeft className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminSections.map((section) => (
            <Link
              key={section.id}
              to={section.href}
              className="block"
            >
              <Button
                variant={isActiveRoute(section.href) ? "default" : "ghost"}
                className={`w-full justify-start transition-colors ${
                  sidebarCollapsed && !isMobile && !isTablet ? 'px-2' : 'px-4'
                } ${
                  isTablet ? 'h-12 text-base' : 'h-10 text-sm'
                }`}
              >
                {section.icon}
                {(!sidebarCollapsed || isMobile || isTablet) && (
                  <span className="ml-3">{t(section.labelKey)}</span>
                )}
              </Button>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <UserMenu 
            user={user} 
            collapsed={sidebarCollapsed && !isMobile && !isTablet}
            size={isTablet ? 'lg' : 'md'}
          />
        </div>
      </div>
    </>
  )
}
