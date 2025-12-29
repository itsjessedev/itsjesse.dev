"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "mobile-app-banner-dismissed-v2";

export default function MobileAppBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show if not previously dismissed
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
      document.body.classList.add('mobile-banner-visible');
    }
    return () => {
      document.body.classList.remove('mobile-banner-visible');
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    document.body.classList.remove('mobile-banner-visible');
  };

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner - fixed at top, above nav (z-60 > nav's z-50) */}
      <div className="fixed top-0 left-0 right-0 z-[60] md:hidden bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={handleDownloadClick}
            className="flex items-center gap-2 flex-1"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold leading-tight">Get the Android App</p>
              <p className="text-[10px] opacity-80">Native experience, offline support</p>
            </div>
          </button>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Installation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card w-full sm:max-w-md p-5 sm:p-6 relative animate-fade-in rounded-t-2xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">J</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">It&apos;s Jesse!</h3>
                <p className="text-sm text-[var(--text-secondary)]">Android Portfolio App</p>
              </div>
            </div>

            {/* Install instructions */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm font-medium text-[var(--accent)] mb-2">Installation Steps:</p>
                <ol className="text-xs sm:text-sm text-[var(--text-secondary)] space-y-1.5 sm:space-y-2 list-decimal list-inside">
                  <li>Download the APK file to your Android device</li>
                  <li>Open your device Settings &rarr; Security</li>
                  <li>Enable &quot;Install from unknown sources&quot;</li>
                  <li>Open the downloaded APK file</li>
                  <li>Tap &quot;Install&quot; when prompted</li>
                </ol>
              </div>

              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-green-200">
                  Browse projects, view demos, and contact me — all in a native app experience.
                </p>
              </div>
            </div>

            {/* Download button */}
            <a
              href="https://dl.itsjesse.dev/itsjesse-mobile-v11.apk"
              download
              className="w-full btn-primary flex items-center justify-center gap-2"
              onClick={() => setShowModal(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download APK
            </a>
          </div>
        </div>
      )}
    </>
  );
}
