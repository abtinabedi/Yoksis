"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onScan: (result: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (result) => {
          if (!scannedRef.current) {
            scannedRef.current = true;
            // scanner.stop().catch(() => {});
            onScan(result);
          }
        },
        () => {}
      )
      .catch((err) => {
        console.error("QR kamera hatası:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
      <div id="qr-reader" ref={divRef} style={{ width: "100%" }} />
    </div>
  );
}
