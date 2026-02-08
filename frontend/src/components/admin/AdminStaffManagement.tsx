import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Trash2, 
  Search,
  Mail,
  Calendar,
  Shield,
  Edit,
  Table,
  Users
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'
import { UserForm } from '@/components/forms/UserForm'
import { AdminStaffTable } from '@/components/admin/AdminStaffTable'
import { PaginationControlsComponent } from '@/components/ui/pagination-controls'
import { usePagination } from '@/hooks/usePagination'
import { UserListSkeleton } from '@/components/ui/skeletons'
import { InlineLoading } from '@/components/ui/loading-spinner'
import type { User } from '@/types'

type DisplayMode = 'table' | 'cards'

export function AdminStaffManagement() {
  const { t } = useTranslation()
  const [displayMode, setDisplayMode] = useState<DisplayMode>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const queryClient = useQueryClient()

  // Pagination hook
  const pagination = usePagination({ 
    initialPage: 1, 
    initialPageSize: 10,
    total: 0 
  })

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setIsSearching(true)
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      pagination.goToFirstPage()
      setIsSearching(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  // Fetch users with pagination
  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ['users', pagination.page, pagination.pageSize, debouncedSearch],
    queryFn: () => apiClient.getUsers({
      page: pagination.page,
      limit: pagination.pageSize,
      search: debouncedSearch || undefined
    }).then((res) => res.data)
  })

  // Extract data and pagination info - handle both array and paginated response formats
  const usersDataTyped = usersData as User[] | { data: User[]; pagination: { total: number } } | undefined
  const users = Array.isArray(usersDataTyped) ? usersDataTyped : (usersDataTyped as { data: User[]; pagination: { total: number } } | undefined)?.data || []
  const paginationInfo = (usersDataTyped as { data: User[]; pagination: { total: number } } | undefined)?.pagination || { total: 0 }

  // Delete user mutation (keep existing functionality)  
  const deleteUserMutation = useMutation({
    mutationFn: ({ id }: { id: string, username: string }) => apiClient.deleteUser(id),
    onSuccess: (_, { username: deletedUsername }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastHelpers.userDeleted(deletedUsername)
    },
    onError: (error: Error) => {
      toastHelpers.apiError('Delete user', error)
    }
  })

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    setEditingUser(null)
  }

  const handleCancelForm = () => {
    setShowCreateForm(false)
    setEditingUser(null)
  }

  const handleDeleteUser = (user: User) => {
    const displayName = `${user.first_name} ${user.last_name}`
    if (confirm(t('admin.confirmDeleteStaff', { name: displayName }))) {
      deleteUserMutation.mutate({
        id: user.id.toString(),
        username: displayName
      })
    }
  }

  // Data is already filtered on the server side
  const filteredUsers = users

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'manager': return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'server': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'counter': return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'kitchen': return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  // Show form if creating or editing
  if (showCreateForm || editingUser) {
    return (
      <div className="p-6">
        <UserForm
          user={editingUser || undefined}
          mode={editingUser ? 'edit' : 'create'}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        </div>
        
        {/* Search and Controls Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md" />
        </div>
        
        {/* User List Skeleton */}
        <UserListSkeleton count={pagination.pageSize} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('admin.staffManagement')}</h2>
          <p className="text-muted-foreground">
            {t('admin.staffManagementDesc')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={displayMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('table')}
              className="px-3"
            >
              <Table className="h-4 w-4 mr-1" />
              {t('admin.tableView')}
            </Button>
            <Button
              variant={displayMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('cards')}
              className="px-3"
            >
              <Users className="h-4 w-4 mr-1" />
              {t('admin.cardsView')}
            </Button>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t('admin.addNewStaff')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchStaffPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {isSearching && (
              <div className="absolute right-2 top-2.5">
                <InlineLoading size="sm" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="space-y-4">
        {displayMode === 'table' ? (
          <AdminStaffTable
            data={filteredUsers}
            onEdit={setEditingUser}
            onDelete={handleDeleteUser}
            isLoading={isLoading}
          />
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Users}
                title={searchTerm ? t('admin.noStaffFound') : t('admin.noStaffYet')}
                description={
                  searchTerm
                    ? t('admin.noStaffFoundDesc')
                    : t('admin.noStaffYetDesc')
                }
                action={
                  searchTerm
                    ? {
                        label: t('admin.clearSearch'),
                        onClick: () => setSearchTerm(''),
                      }
                    : {
                        label: t('admin.addNewStaff'),
                        onClick: () => setShowCreateForm(true),
                      }
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user: User) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {t('admin.joined')} {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending}
                        className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        {deleteUserMutation.isPending ? (
                          <InlineLoading size="sm" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination with loading state */}
      {filteredUsers.length > 0 && (
        <div className="mt-6 space-y-4">
          {isFetching && !isLoading && (
            <div className="flex justify-center">
              <InlineLoading text={t('admin.updatingResults')} />
            </div>
          )}
          <PaginationControlsComponent
            pagination={pagination}
            total={paginationInfo.total || users.length}
          />
        </div>
      )}
    </div>
  )
}