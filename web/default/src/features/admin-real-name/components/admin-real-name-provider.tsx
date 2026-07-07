/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import React, { useCallback, useState } from 'react'
import type { AdminRealNameRecord } from '../types'

type AdminRealNameContextType = {
  refreshTrigger: number
  triggerRefresh: () => void
  editingRecord: AdminRealNameRecord | null
  openEditDialog: (record: AdminRealNameRecord) => void
  closeEditDialog: () => void
  deletingRecord: AdminRealNameRecord | null
  openDeleteDialog: (record: AdminRealNameRecord) => void
  closeDeleteDialog: () => void
}

const AdminRealNameContext = React.createContext<AdminRealNameContextType | null>(
  null
)

export function AdminRealNameProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingRecord, setEditingRecord] = useState<AdminRealNameRecord | null>(
    null
  )
  const [deletingRecord, setDeletingRecord] =
    useState<AdminRealNameRecord | null>(null)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const openEditDialog = useCallback((record: AdminRealNameRecord) => {
    setEditingRecord(record)
  }, [])

  const closeEditDialog = useCallback(() => {
    setEditingRecord(null)
  }, [])

  const openDeleteDialog = useCallback((record: AdminRealNameRecord) => {
    setDeletingRecord(record)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeletingRecord(null)
  }, [])

  return (
    <AdminRealNameContext
      value={{
        refreshTrigger,
        triggerRefresh,
        editingRecord,
        openEditDialog,
        closeEditDialog,
        deletingRecord,
        openDeleteDialog,
        closeDeleteDialog,
      }}
    >
      {children}
    </AdminRealNameContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminRealName = () => {
  const ctx = React.useContext(AdminRealNameContext)
  if (!ctx) {
    throw new Error(
      'useAdminRealName must be used within <AdminRealNameProvider>'
    )
  }
  return ctx
}
