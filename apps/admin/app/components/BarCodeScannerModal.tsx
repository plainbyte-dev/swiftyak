'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, CameraOff } from 'lucide-react';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export default function BarcodeScannerModal({ open, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setCameraError(null);
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result, err, controls) => {
          controlsRef.current = controls;
          if (cancelled) return;
          if (result) {
            controls.stop();
            onScan(result.getText());
          }
          // NotFoundException fires continuously while no barcode is in frame — ignore it.
        }
      )
      .catch(() => {
        if (!cancelled) setCameraError('Could not access the camera. Check browser permissions.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-700 text-foreground">Scan Barcode</p>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="relative aspect-square bg-black">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 text-white/80">
              <CameraOff size={24} />
              <p className="text-xs">{cameraError}</p>
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          )}
          {/* Scan guide box */}
          <div className="absolute inset-8 border-2 border-primary/70 rounded-lg pointer-events-none" />
        </div>
        <p className="px-4 py-3 text-xs text-muted-foreground text-center">
          Point the camera at the label's barcode
        </p>
      </div>
    </div>
  );
}