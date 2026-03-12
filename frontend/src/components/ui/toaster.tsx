"use client"

import * as React from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "./button"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, variant, open }) {
        if (!open) return null;

        return (
          <div
            key={id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all mb-4 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
              variant === "destructive" && "bg-red-600 text-white border-red-600",
              variant === "success" && "bg-green-600 text-white border-green-600",
              (!variant || variant === "default") && "bg-white border-gray-200 text-gray-900"
            )}
          >
            <div className="flex items-start gap-4">
               {variant === "destructive" && <XCircle className="w-5 h-5 text-white" />}
               {variant === "success" && <CheckCircle2 className="w-5 h-5 text-white" />}
               {(!variant || variant === "default") && <Info className="w-5 h-5 text-indigo-500" />}
              <div className="grid gap-1">
                {title && <div className="text-sm font-semibold">{title}</div>}
                {description && (
                  <div className="text-sm opacity-90">{description}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismiss(id)}
              className={cn(
                "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-100",
                variant === "destructive" ? "text-red-300 hover:text-red-50 focus:ring-red-400 focus:ring-offset-red-600" :
                variant === "success" ? "text-green-300 hover:text-green-50 focus:ring-green-400 focus:ring-offset-green-600" :
                "text-gray-500 hover:text-gray-900"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
