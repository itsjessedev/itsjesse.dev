"use client";

import { useState } from "react";

interface DownloadModalProps {
  appName: string;
  downloadUrl: string;
  isLarge?: boolean;
}

export default function DownloadModal({ appName, downloadUrl, isLarge = false }: DownloadModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Download button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`absolute ${isLarge ? "bottom-4 left-4" : "bottom-3 left-3"} z-20 text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg shadow-black/40 backdrop-blur-sm hover:bg-green-600 hover:scale-105 transition-all duration-200 cursor-pointer`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Demo APK
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="glass-card max-w-md w-full p-6 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Install {appName}</h3>
                <p className="text-sm text-[var(--text-secondary)]">Android Demo App</p>
              </div>
            </div>

            {/* Install instructions */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm font-medium text-[var(--accent)] mb-2">Installation Steps:</p>
                <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
                  <li>Download the APK file to your Android device</li>
                  <li>Open your device Settings &rarr; Security</li>
                  <li>Enable &quot;Install from unknown sources&quot;</li>
                  <li>Open the downloaded APK file</li>
                  <li>Tap &quot;Install&quot; when prompted</li>
                </ol>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-yellow-200">
                  This is a demo APK for testing purposes. iOS version available upon request.
                </p>
              </div>
            </div>

            {/* Download button */}
            <a
              href={downloadUrl}
              download
              className="w-full btn-primary flex items-center justify-center gap-2"
              onClick={() => setIsOpen(false)}
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
