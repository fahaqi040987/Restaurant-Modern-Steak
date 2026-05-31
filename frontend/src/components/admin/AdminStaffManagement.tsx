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
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
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
type ActiveTab = 'all' | 'pending'

const VALID_ROLES = ['admin', 'manager', 'server', 'counter', 'kitchen'] as const
type Role = (typeof VALID_ROLES)[number]

export function AdminStaffManagement() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // For role selection popup per user
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>('server')

  const queryClient = useQueryClient()

  // Pagination hook
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: 0,
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

  // Fetch all users
  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ['users', pagination.page, pagination.pageSize, debouncedSearch],
    queryFn: () =>
      apiClient
        .getUsers({
          page: pagination.page,
          limit: pagination.pageSize,
          search: debouncedSearch || undefined,
        })
        .then((res) => res.data),
  })

  // Extract data and pagination info
  const usersDataTyped = usersData as User[] | { data: User[]; pagination: { total: number } } | undefined
  const allUsers = Array.isArray(usersDataTyped)
    ? usersDataTyped
    : (usersDataTyped as { data: User[]; pagination: { total: number } } | undefined)?.data || []
  const paginationInfo = (usersDataTyped as { data: User[]; pagination: { total: number } } | undefined)?.pagination || { total: 0 }

  // Split into pending and normal users
  const pendingUsers = allUsers.filter((u: User) => u.approval_status === 'pending')
  const activeUsers = allUsers.filter((u: User) => u.approval_status !== 'pending')
  const filteredUsers = activeTab === 'pending' ? pendingUsers : activeUsers

  // ── Mutations ───────────────────────────────────────────────────────────────

  const deleteUserMutation = useMutation({
    mutationFn: ({ id }: { id: string; username: string }) => apiClient.deleteUser(id),
    onSuccess: (_, { username: deletedUsername }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastHelpers.userDeleted(deletedUsername)
    },
    onError: (error: Error) => {
      toastHelpers.apiError('Delete user', error)
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiClient.approveUser(id, role),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setApprovingUserId(null)
      toastHelpers.success('User Approved', `User has been approved with role: ${role}`)
    },
    onError: (error: Error) => {
      toastHelpers.apiError('Approve user', error)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.rejectUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toastHelpers.success('User Rejected', 'User has been rejected.')
    },
    onError: (error: Error) => {
      toastHelpers.apiError('Reject user', error)
    },
  })

  // ── Handlers ────────────────────────────────────────────────────────────────

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
      deleteUserMutation.mutate({ id: user.id.toString(), username: displayName })
    }
  }

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ id: userId, role: selectedRole })
  }

  const handleReject = (userId: string, userName: string) => {
    if (confirm(`Reject ${userName}'s account request? They will need to wait 24 hours before re-applying.`)) {
      rejectMutation.mutate(userId)
    }
  }

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

  // ── Render form ─────────────────────────────────────────────────────────────

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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md" />
        </div>
        <UserListSkeleton count={pagination.pageSize} />
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('admin.staffManagement')}</h2>
          <p className="text-muted-foreground">{t('admin.staffManagementDesc')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggle (only on All tab) */}
          {activeTab === 'all' && (
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
          )}
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t('admin.addNewStaff')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          All Staff
          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">{activeUsers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Approval
          {pendingUsers.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Search (only on all tab) */}
      {activeTab === 'all' && (
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
      )}

      {/* ── PENDING APPROVAL TAB ──────────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3">
                <CheckCircle className="h-12 w-12 text-green-400" />
                <p className="text-lg font-semibold">All clear!</p>
                <p className="text-sm text-muted-foreground">No users are pending approval.</p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user: User) => {
              const userName = `${user.first_name} ${user.last_name}`
              const isApproving = approvingUserId === user.id.toString()
              return (
                <Card key={user.id} className="border-yellow-200 bg-yellow-50/30">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{userName}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            Requested: {new Date(user.created_at).toLocaleDateString()}
                          {user.google_id && (
                              <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                Google SSO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isApproving ? (
                          /* Role selection panel */
                          <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-2 shadow-sm">
                            <span className="text-xs font-medium text-gray-600">Assign role:</span>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as Role)}
                              className="text-sm border border-border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {VALID_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              className="gap-1 bg-green-600 hover:bg-green-700 text-white h-8"
                              onClick={() => handleApprove(user.id.toString())}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? (
                                <InlineLoading size="sm" />
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Confirm
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-gray-500"
                              onClick={() => setApprovingUserId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setApprovingUserId(user.id.toString())
                                setSelectedRole('server')
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              onClick={() => handleReject(user.id.toString(), userName)}
                              disabled={rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? (
                                <InlineLoading size="sm" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ── ALL STAFF TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'all' && (
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
                      ? { label: t('admin.clearSearch'), onClick: () => setSearchTerm('') }
                      : { label: t('admin.addNewStaff'), onClick: () => setShowCreateForm(true) }
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

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 space-y-4">
              {isFetching && !isLoading && (
                <div className="flex justify-center">
                  <InlineLoading text={t('admin.updatingResults')} />
                </div>
              )}
              <PaginationControlsComponent
                pagination={pagination}
                total={paginationInfo.total || allUsers.length}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}