import type { ComponentProps } from "react";

const iconProps = {
  className: "h-10 w-10 text-sagar-saffron"
};

type IconProps = ComponentProps<"svg"> & { name: string };

export default function DeityIcon({ name, className, ...rest }: IconProps) {
  switch (name) {
    case "ganesha":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <path
            d="M22 22c0-6 5-10 10-10s10 4 10 10v3c0 3-2 6-5 7 4 1 7 5 7 10 0 9-7 16-16 16s-16-7-16-16c0-5 3-9 7-10-3-1-5-4-5-7v-3z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M16 45c2-6 9-10 16-10s14 4 16 10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M32 18v12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 30c-6 0-9 4-9 9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="24" cy="28" r="2.5" fill="currentColor" />
          <circle cx="40" cy="28" r="2.5" fill="currentColor" />
        </svg>
      );
    case "vishnu":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <circle cx="32" cy="32" r="18" fill="currentColor" opacity="0.18" />
          <path d="M32 14v10M32 40v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 32h10M40 32h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 22l5 5M42 22l-5 5M22 42l5-5M42 42l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "shiva":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <path d="M32 10c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z" fill="currentColor" opacity="0.16" />
          <path d="M32 14v28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 38h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 18c4-6 20-6 24 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M10 48c6-2 12-2 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "shakti":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <path d="M32 12c8 6 14 14 14 24s-6 16-14 16-14-6-14-16 6-18 14-24z" fill="currentColor" opacity="0.16" />
          <path d="M32 18l6 12-6 14-6-14 6-12z" fill="currentColor" />
        </svg>
      );
    case "krishna":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <circle cx="32" cy="32" r="16" fill="currentColor" opacity="0.16" />
          <path d="M18 38c8-6 20-6 28 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M20 26c6 4 18 4 24 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M42 18c4-2 8 2 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "hanuman":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <path d="M32 12c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z" fill="currentColor" opacity="0.16" />
          <path d="M24 44c4 4 12 4 16 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M24 28c2 2 6 2 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M40 20l8-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "lakshmi":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <path d="M32 12c8 6 14 14 14 22 0 10-6 18-14 18s-14-8-14-18c0-8 6-16 14-22z" fill="currentColor" opacity="0.16" />
          <path d="M32 22l8 10-8 10-8-10 8-10z" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      );
    case "saraswati":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <circle cx="32" cy="30" r="14" fill="currentColor" opacity="0.16" />
          <path d="M20 44h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M26 20l12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 20l-12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" {...iconProps} className={className ?? iconProps.className} {...rest}>
          <circle cx="32" cy="32" r="18" fill="currentColor" opacity="0.18" />
          <path d="M20 32h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 20v24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}
