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
import { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Edit, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { resolveIcon, ICON_OPTIONS, GROUP_OPTIONS } from './custom-sidebar-config'
import type { CustomSidebarItem, CustomSidebarSubItem } from './custom-sidebar-types'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type CustomSidebarSectionProps = {
  config: CustomSidebarItem[]
  initialSerialized: string
}

const subItemSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().min(1).max(500),
})

type ItemFormValues = {
  title: string
  icon: string
  url?: string
  group: string
  adminOnly?: boolean
  items?: CustomSidebarSubItem[]
}

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function CustomSidebarSection({
  config,
  initialSerialized,
}: CustomSidebarSectionProps) {
  const { t } = useTranslation()
  const itemSchema = z.object({
    title: z
      .string()
      .min(1, t('Title is required'))
      .max(100, t('Title must be less than 100 characters')),
    icon: z.string().min(1, t('Icon is required')),
    url: z.string().max(500).optional(),
    group: z.string().min(1, t('Group is required')),
    adminOnly: z.boolean().optional(),
    items: z.array(subItemSchema).optional(),
  })
  const updateOption = useUpdateOption()
  const [list, setList] = useState<CustomSidebarItem[]>(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<CustomSidebarItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'batch'>('single')
  const [subItems, setSubItems] = useState<CustomSidebarSubItem[]>([])

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: '',
      icon: 'Link',
      url: '',
      group: 'general',
      adminOnly: false,
      items: [],
    },
  })

  useEffect(() => {
    setList(config)
  }, [config])

  const handleAdd = () => {
    setEditingItem(null)
    setSubItems([])
    form.reset({
      title: '',
      icon: 'Link',
      url: '',
      group: 'general',
      adminOnly: false,
      items: [],
    })
    setShowDialog(true)
  }

  const handleEdit = (item: CustomSidebarItem) => {
    setEditingItem(item)
    setSubItems(item.items ?? [])
    form.reset({
      title: item.title,
      icon: item.icon,
      url: item.url ?? '',
      group: item.group,
      adminOnly: item.adminOnly ?? false,
      items: item.items ?? [],
    })
    setShowDialog(true)
  }

  const handleDelete = (item: CustomSidebarItem) => {
    setEditingItem(item)
    setDeleteTarget('single')
    setShowDeleteDialog(true)
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget('batch')
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteTarget === 'single' && editingItem) {
      setList((prev) => prev.filter((item) => item.id !== editingItem.id))
      toast.success(t('Item deleted. Click "Save Settings" to apply.'))
    } else if (deleteTarget === 'batch') {
      setList((prev) => prev.filter((item) => !selectedIds.includes(item.id)))
      setSelectedIds([])
      toast.success(
        t('{{count}} items deleted. Click "Save Settings" to apply.', {
          count: selectedIds.length,
        })
      )
    }
    setHasChanges(true)
    setShowDeleteDialog(false)
    setEditingItem(null)
  }

  const handleSubmitForm = (values: ItemFormValues) => {
    const hasSubItems = subItems.length > 0

    if (editingItem) {
      setList((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                title: values.title,
                icon: values.icon,
                url: hasSubItems ? undefined : values.url || undefined,
                group: values.group,
                adminOnly: values.adminOnly,
                items: hasSubItems ? subItems : undefined,
              }
            : item
        )
      )
      toast.success(t('Item updated. Click "Save Settings" to apply.'))
    } else {
      const newItem: CustomSidebarItem = {
        id: generateId(),
        title: values.title,
        icon: values.icon,
        url: hasSubItems ? undefined : values.url || undefined,
        group: values.group,
        adminOnly: values.adminOnly,
        items: hasSubItems ? subItems : undefined,
      }
      setList((prev) => [...prev, newItem])
      toast.success(t('Item added. Click "Save Settings" to apply.'))
    }
    setHasChanges(true)
    setShowDialog(false)
  }

  const handleSaveAll = async () => {
    const serialized = JSON.stringify(list)
    if (serialized === initialSerialized) return
    await updateOption.mutateAsync({
      key: 'CustomSidebarItems',
      value: serialized,
    })
    setHasChanges(false)
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    setList((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
    setHasChanges(true)
  }

  const handleMoveDown = (index: number) => {
    if (index >= list.length - 1) return
    setList((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
    setHasChanges(true)
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? list.map((item) => item.id) : [])
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    )
  }

  const addSubItem = () => {
    setSubItems((prev) => [...prev, { title: '', url: '' }])
  }

  const removeSubItem = (index: number) => {
    setSubItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSubItem = (index: number, field: keyof CustomSidebarSubItem, value: string) => {
    setSubItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const groupLabel = (groupId: string) => {
    const found = GROUP_OPTIONS.find((g) => g.value === groupId)
    return found ? t(found.label) : groupId
  }

  return (
    <SettingsSection title={t('Custom Sidebar Items')}>
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button onClick={handleAdd} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              {t('Add Item')}
            </Button>
            <Button
              onClick={handleBatchDelete}
              size='sm'
              variant='destructive'
              disabled={selectedIds.length === 0}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              {t('Delete ({{count}})', { count: selectedIds.length })}
            </Button>
            <Button
              onClick={handleSaveAll}
              size='sm'
              variant='secondary'
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 h-4 w-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>
                  <Checkbox
                    checked={list.length > 0 && selectedIds.length === list.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Icon')}</TableHead>
                <TableHead>{t('URL / Sub-items')}</TableHead>
                <TableHead>{t('Group')}</TableHead>
                <TableHead className='w-32'>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    {t('No custom sidebar items yet. Click "Add Item" to create one.')}
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item, index) => {
                  const IconComponent = resolveIcon(item.icon)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(c) =>
                            toggleSelectOne(item.id, c as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <IconComponent className='h-4 w-4 shrink-0' />
                          {item.title}
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {item.icon}
                      </TableCell>
                      <TableCell className='max-w-xs'>
                        {item.items && item.items.length > 0 ? (
                          <span className='text-muted-foreground'>
                            {t('{{count}} sub-items', { count: item.items.length })}
                          </span>
                        ) : (
                          <span
                            className='block max-w-xs truncate'
                            title={item.url}
                          >
                            {item.url}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{groupLabel(item.group)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button
                            onClick={() => handleMoveUp(index)}
                            size='sm'
                            variant='ghost'
                            disabled={index === 0}
                            className='h-8 w-8 p-0'
                          >
                            <ArrowUp className='h-4 w-4' />
                          </Button>
                          <Button
                            onClick={() => handleMoveDown(index)}
                            size='sm'
                            variant='ghost'
                            disabled={index === list.length - 1}
                            className='h-8 w-8 p-0'
                          >
                            <ArrowDown className='h-4 w-4' />
                          </Button>
                          <Button
                            onClick={() => handleEdit(item)}
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 p-0'
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            onClick={() => handleDelete(item)}
                            size='sm'
                            variant='ghost'
                            className='h-8 w-8 p-0'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('Edit Sidebar Item') : t('Add Sidebar Item')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Add a custom navigation entry to the sidebar. It will appear in the selected group.'
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Title')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('My Link')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='icon'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Icon')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='max-h-60'>
                          {ICON_OPTIONS.map(({ value, label, Icon }) => (
                            <SelectItem key={value} value={value}>
                              <div className='flex items-center gap-2'>
                                <Icon className='h-4 w-4' />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='group'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Group')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GROUP_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {t(label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('Which sidebar section this item belongs to.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('URL')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('/my-page or https://...')}
                        disabled={subItems.length > 0}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Internal path (e.g. /docs) or external URL (e.g. https://example.com). Disabled when sub-items are configured.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <FormLabel>{t('Sub-items')}</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addSubItem}
                  >
                    <Plus className='mr-1 h-3 w-3' />
                    {t('Add Sub-item')}
                  </Button>
                </div>
                <FormDescription>
                  {t(
                    'Add sub-items to create a collapsible menu. When sub-items exist, the URL field is ignored.'
                  )}
                </FormDescription>
                {subItems.map((sub) => (
                  <div
                    key={`sub-item-${sub.title}-${sub.url}`}
                    className='flex items-start gap-2 rounded-md border p-3'
                  >
                    <div className='grid flex-1 grid-cols-2 gap-2'>
                      <Input
                        value={sub.title}
                        onChange={(e) =>
                          updateSubItem(subItems.indexOf(sub), 'title', e.target.value)
                        }
                        placeholder={t('Sub-item title')}
                      />
                      <Input
                        value={sub.url}
                        onChange={(e) =>
                          updateSubItem(subItems.indexOf(sub), 'url', e.target.value)
                        }
                        placeholder={t('/sub-page or https://...')}
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeSubItem(subItems.indexOf(sub))}
                      className='shrink-0'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowDialog(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button type='submit'>
                  {editingItem ? t('Update') : t('Add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'single'
                ? t(
                    'This sidebar item will be removed from the list. Click "Save Settings" to apply.'
                  )
                : t(
                    '{{count}} sidebar items will be removed from the list. Click "Save Settings" to apply.',
                    { count: selectedIds.length }
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
