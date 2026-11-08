import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'onDark'

export interface ButtonProps extends React.AriaAttributes {
  variant?: ButtonVariant
  href?: string
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  fullWidthMobile?: boolean
  showArrow?: boolean
  formAction?: string | ((formData: FormData) => void | Promise<void>)
}

function buildVariantClasses(variant: ButtonVariant, custom: string): string {
  const hasBg = /\bbg-/.test(custom)
  const hasHoverBg = /\bhover:bg-/.test(custom)
  const hasTextColor = /\btext-(white|black|\[#)/.test(custom)
  const hasBorderWidth = /\bborder(-[024]|\b)/.test(custom)
  const hasBorderColor = /\bborder-\[#/.test(custom)
  const hasHoverBorder = /\bhover:border-/.test(custom)
  const hasFontWeight = /\bfont-(normal|medium|semibold|bold|extrabold)/.test(custom)

  const tokens: string[] = []

  if (variant === 'primary') {
    if (!hasBg) tokens.push('bg-[#CF3F29]')
    if (!hasHoverBg) tokens.push('hover:bg-[#B83420]')
    if (!hasTextColor) tokens.push('text-white')
    if (!hasFontWeight) tokens.push('font-bold')
  } else if (variant === 'secondary') {
    if (!hasBg) tokens.push('bg-white')
    if (!hasBorderWidth) tokens.push('border-2')
    if (!hasBorderColor) tokens.push('border-[#F5ECDE]')
    if (!hasTextColor) tokens.push('text-[#232536]')
    if (!hasHoverBorder && !hasBorderColor) tokens.push('hover:border-[#232536]/25')
    if (!hasFontWeight) tokens.push('font-bold')
  } else if (variant === 'onDark') {
    if (!hasBg) tokens.push('bg-[#FDF8F1]')
    if (!hasTextColor) tokens.push('text-[#232536]')
    if (!hasHoverBg) tokens.push('hover:bg-white')
    if (!hasHoverBorder && !hasBorderColor) tokens.push('hover:border-[#232536]/25')
    if (!hasFontWeight) tokens.push('font-bold')
  }

  return tokens.join(' ')
}

export default function Button({
  variant = 'primary',
  href,
  children,
  className = '',
  type = 'button',
  disabled,
  onClick,
  fullWidthMobile = false,
  showArrow = false,
  formAction,
  ...ariaProps
}: ButtonProps) {
  const hasGap = /\bgap-/.test(className)
  const hasHeight = /\b(max-md:)?h-\[/.test(className)

  const focusClasses =
    variant === 'onDark'
      ? 'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#FDF8F1]'
      : 'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#232536]'

  const baseClasses = [
    showArrow ? 'group' : '',
    'inline-flex items-center justify-center rounded-full transition-all',
    hasGap ? '' : 'gap-2',
    hasHeight ? '' : 'max-md:h-[52px]',
    fullWidthMobile ? 'max-md:w-full' : '',
    buildVariantClasses(variant, className),
    focusClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {children}
      {showArrow && (
        <ArrowRight
          size={14}
          strokeWidth={2.5}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={baseClasses} {...ariaProps}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      formAction={formAction}
      className={baseClasses}
      {...ariaProps}
    >
      {content}
    </button>
  )
}
