"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("standalone" in window && (window.navigator as Navigator & { standalone?: boolean }).standalone)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches

    if (isInStandaloneMode) return

    if (isIos) {
      setShowIos(true)
      setDismissed(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setDismissed(false)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1")
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }

  if (dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📅</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Installer Familiekalender
          </p>
          {showIos ? (
            <p className="text-xs text-gray-600 mt-1">
              Trykk{" "}
              <span className="inline-flex items-center gap-0.5 font-medium">
                Del <span>⎙</span>
              </span>{" "}
              og velg «Legg til på Hjem-skjerm» for å installere.
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">
              Legg til på hjem-skjermen for rask tilgang.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Lukk"
        >
          ✕
        </button>
      </div>
      {!showIos && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={dismiss}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ikke nå
          </button>
          <button
            onClick={install}
            className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Installer
          </button>
        </div>
      )}
    </div>
  )
}
