// Generated from @specs/ui/components.md
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'high' | 'medium' | 'low' | 'none'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5',
        'text-[10px] font-medium uppercase tracking-wider',
        variant === 'high' && 'bg-gradient-to-r from-[#ef4444] to-[#f5576c] text-white shadow-sm shadow-red-500/30',
        variant === 'medium' && 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-[#0a0a0b] shadow-sm shadow-yellow-500/30',
        variant === 'low' && 'bg-[#06b6d4]/20 border border-[#06b6d4]/50 text-[#06b6d4]',
        variant === 'none' && 'bg-transparent border border-[#71717a] text-[#71717a]',
        variant === 'default' && 'bg-white/5 border border-white/10 text-[#a1a1aa]',
        className
      )}
      {...props}
    />
  )
}

// Priority Badge specifically for tasks
interface PriorityBadgeProps {
  priority: 'P1' | 'P2' | 'P3' | string
  className?: string
}

function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variant =
    priority === 'P1' ? 'high' :
    priority === 'P2' ? 'medium' :
    priority === 'P3' ? 'low' : 'none'

  const label =
    priority === 'P1' ? 'HIGH' :
    priority === 'P2' ? 'MEDIUM' :
    priority === 'P3' ? 'LOW' : priority

  return <Badge variant={variant} className={className}>{label}</Badge>
}

export { Badge, PriorityBadge }
