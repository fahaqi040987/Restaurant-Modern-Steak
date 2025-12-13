import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {(action || secondaryAction || children) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

// Compact variant for smaller spaces (like table rows)
interface EmptyStateInlineProps {
  icon: LucideIcon
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyStateInline({
  icon: Icon,
  message,
  action,
}: EmptyStateInlineProps) {
  return (
    <div className="flex items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Icon className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {action && (
          <Button onClick={action.onClick} size="sm" variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
