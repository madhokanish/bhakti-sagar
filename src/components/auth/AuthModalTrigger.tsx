"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

type AuthModalTriggerProps = {
  callbackUrl?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children">;

export default function AuthModalTrigger({ callbackUrl, children, ...buttonProps }: AuthModalTriggerProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type="button"
      {...buttonProps}
      onClick={(event) => {
        buttonProps.onClick?.(event);
        if (event.defaultPrevented) return;
        openAuthModal({ callbackUrl });
      }}
    >
      {children}
    </button>
  );
}
