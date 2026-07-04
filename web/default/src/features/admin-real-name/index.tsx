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
import { useTranslation } from 'react-i18next'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { SectionPageLayout } from '@/components/layout'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import { AdminRealNameDeleteDialog } from './components/admin-real-name-delete-dialog'
import { AdminRealNameMutateDialog } from './components/admin-real-name-mutate-dialog'
import { AdminRealNameProvider } from './components/admin-real-name-provider'
import { AdminRealNameTable } from './components/admin-real-name-table'

export function AdminRealName() {
  const { t } = useTranslation()
  // Use loose-typed search/navigate to avoid coupling to routeTree.gen.ts
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()

  return (
    <AdminRealNameProvider>
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>
          {t('Real-name Management')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <AdminRealNameTable
            routeSearch={search}
            routeNavigate={navigate as unknown as NavigateFn}
          />
        </SectionPageLayout.Content>
      </SectionPageLayout>
      <AdminRealNameMutateDialog />
      <AdminRealNameDeleteDialog />
    </AdminRealNameProvider>
  )
}
