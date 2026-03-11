import { cn } from "./button"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
