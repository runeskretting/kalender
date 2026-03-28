"use client"

import { signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import type { CalendarUser } from "@/lib/types"

interface HeaderProps {
  user: CalendarUser
}

export default function Header({ user }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <span className="font-semibold text-gray-800 hidden sm:block">
            Familiekalender
          </span>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
            aria-label="Brukermeny"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name ?? ""}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "parent"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.role === "parent" ? "Forelder" : "Barn"}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Logg ut
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
