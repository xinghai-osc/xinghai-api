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
import { useState, useMemo } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { StaticDataTable } from '@/components/data-table'
import { safeJsonParseWithValidation } from '../utils/json-parser'
import { isArray } from '../utils/json-validators'
import {
  EpayGatewayDialog,
  type EpayGatewayData,
} from './epay-gateway-dialog'

type EpayGatewaysVisualEditorProps = {
  value: string
  onChange: (value: string) => void
}

function generateGatewayId(): string {
  return `gw_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function isEpayGatewayData(item: unknown): item is EpayGatewayData {
  return (
    typeof item === 'object' &&
    item !== null &&
    'name' in item &&
    'pay_address' in item &&
    'epay_id' in item &&
    typeof (item as Record<string, unknown>).name === 'string' &&
    typeof (item as Record<string, unknown>).pay_address === 'string' &&
    typeof (item as Record<string, unknown>).epay_id === 'string'
  )
}

export function EpayGatewaysVisualEditor({
  value,
  onChange,
}: EpayGatewaysVisualEditorProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<EpayGatewayData | null>(null)

  const gateways = useMemo(() => {
    const parsed = safeJsonParseWithValidation<unknown[]>(value, {
      fallback: [],
      validator: isArray,
      validatorMessage: 'Epay gateways must be a JSON array',
      context: 'epay gateways',
    })

    return parsed.filter(isEpayGatewayData)
  }, [value])

  const handleSave = (data: EpayGatewayData) => {
    const parsed = safeJsonParseWithValidation<unknown[]>(value, {
      fallback: [],
      validator: isArray,
      silent: true,
    })

    const updatedArray = [...parsed]

    if (editData) {
      const index = updatedArray.findIndex(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          (item as Record<string, unknown>).id === editData.id
      )
      if (index !== -1) {
        updatedArray[index] = data
      } else {
        updatedArray.push(data)
      }
    } else {
      // Assign a new unique id for new gateways
      data.id = generateGatewayId()
      updatedArray.push(data)
    }

    onChange(JSON.stringify(updatedArray, null, 2))
  }

  const handleDelete = (gateway: EpayGatewayData) => {
    const parsed = safeJsonParseWithValidation<unknown[]>(value, {
      fallback: [],
      validator: isArray,
      silent: true,
    })

    const updatedArray = parsed.filter(
      (item) =>
        !(
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          (item as Record<string, unknown>).id === gateway.id
        )
    )

    onChange(JSON.stringify(updatedArray, null, 2))
  }

  const handleEdit = (gateway: EpayGatewayData) => {
    setEditData(gateway)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button
          type='button'
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleAdd()
          }}
        >
          <Plus className='h-4 w-4 sm:mr-2' />
          <span className='sm:inline'>{t('Add gateway')}</span>
        </Button>
      </div>

      {gateways.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm'>
          {t(
            'No Epay gateways configured. Click "Add gateway" to get started.'
          )}
        </div>
      ) : (
        <div className='rounded-md border'>
          {/* Desktop table view */}
          <StaticDataTable
            className='hidden rounded-none border-0 md:block'
            data={gateways}
            getRowKey={(gateway, index) => `${gateway.id}-${index}`}
            columns={[
              {
                id: 'name',
                header: t('Name'),
                cellClassName: 'font-medium',
                cell: (gateway) => gateway.name,
              },
              {
                id: 'pay_address',
                header: t('Epay endpoint'),
                cell: (gateway) => (
                  <span className='text-muted-foreground truncate font-mono text-sm'>
                    {gateway.pay_address}
                  </span>
                ),
              },
              {
                id: 'epay_id',
                header: t('Merchant ID'),
                cell: (gateway) => (
                  <code className='bg-muted rounded px-1.5 py-0.5 text-sm'>
                    {gateway.epay_id}
                  </code>
                ),
              },
              {
                id: 'epay_key',
                header: t('Secret key'),
                cell: (gateway) => (
                  <span className='text-muted-foreground text-sm'>
                    {gateway.epay_key
                      ? '••••••••'
                      : t('Preserved (not shown)')}
                  </span>
                ),
              },
              {
                id: 'actions',
                header: t('Actions'),
                className: 'text-right',
                cellClassName: 'text-right',
                cell: (gateway) => (
                  <div className='flex justify-end gap-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEdit(gateway)
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(gateway)
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {/* Mobile card view */}
          <div className='divide-y md:hidden'>
            {gateways.map((gateway) => (
              <div key={gateway.id} className='p-4'>
                <div className='mb-3 flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='mb-1 font-medium'>{gateway.name}</div>
                    <code className='bg-muted rounded px-1.5 py-0.5 text-xs'>
                      {gateway.epay_id}
                    </code>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEdit(gateway)
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(gateway)
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <div className='space-y-1 text-sm'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground min-w-20'>
                      {t('Endpoint')}
                    </span>
                    <span className='text-muted-foreground truncate font-mono text-xs'>
                      {gateway.pay_address}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EpayGatewayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editData={editData}
      />
    </div>
  )
}
