import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-[0.96]" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border shadow-sm hover:shadow-md",
        outline:
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          " border [border-color:var(--button-outline)] bg-background/60 backdrop-blur-sm shadow-sm hover:shadow-md active:shadow-sm ",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border shadow-sm hover:shadow-md ",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent hover:bg-accent/50 rounded-lg",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-11 px-6 py-3", /* iOS standard 44px touch target */
        sm: "min-h-11 rounded-md px-4 py-2 text-xs", /* Keep iOS 44px minimum */
        lg: "min-h-12 rounded-lg px-8 py-4 text-base", /* iOS comfortable touch target */
        xl: "min-h-[3.75rem] rounded-xl px-10 py-5 text-lg", /* iOS large 60px target */
        icon: "h-11 w-11 rounded-full", /* iOS circular icon button */
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
