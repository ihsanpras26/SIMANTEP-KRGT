export const buttonVariants = {
  // Primary - Main CTA actions
  default: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm border border-primary-600',

  // Destructive - Delete/Remove actions
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md border border-red-600',

  // Outline - Secondary actions
  outline: 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300',

  // Secondary - Lighter secondary actions
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200',

  // Ghost - Minimal emphasis
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',

  // Subtle - Very low emphasis
  subtle: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50',

  // Link - Text link style
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto',

  // Success - Positive actions
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md border border-emerald-600',

  // Warning - Caution actions
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md border border-amber-500',
};

export const sizeVariants = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  default: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-sm rounded-xl gap-2',
  icon: 'h-11 w-11 rounded-xl p-0',
  iconSm: 'h-8 w-8 rounded-lg p-0',
  iconXs: 'h-7 w-7 rounded-md p-0',
};
