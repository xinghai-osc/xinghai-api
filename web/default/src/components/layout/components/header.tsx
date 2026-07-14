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
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'border-border/60 bg-background/78 supports-[backdrop-filter]:bg-background/68 fixed top-2.5 left-1/2 z-40 mx-auto h-[calc(var(--app-header-height,4rem)-0.625rem)] w-fit max-w-[calc(100%-1.25rem)] -translate-x-1/2 shrink-0 overflow-hidden rounded-2xl border shadow-[0_10px_30px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-xl sm:top-3 sm:h-[calc(var(--app-header-height,4rem)-0.75rem)] sm:max-w-[calc(100%-2rem)]',
        className
      )}
      {...props}
    >
      <div className='mx-auto flex h-full w-fit max-w-full items-center gap-1.5 px-2.5 sm:gap-2 sm:px-4'>
        <SidebarTrigger variant='ghost' className='size-8' />
        {children}
      </div>
    </header>
  )
}
