/**
 * @file Leitor de QR Code via câmera (html5-qrcode) para check-in de ingressos.
 * @module components/QrScanner
 */

import { useEffect, useId, useRef, useState } from "react";
import { Alert, Center, Stack, Text } from "@mantine/core";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { IconCameraOff } from "@tabler/icons-react";

/** Propriedades do scanner de QR para check-in. */
interface QrScannerProps {
  /** Chamado uma vez por leitura única (deduplica leituras repetidas). */
  onScan: (decodedText: string) => void;
  /** Bloqueia novas leituras sem desligar a câmera (ex.: durante API). */
  locked?: boolean;
  /** Inicia a câmera automaticamente ao montar. */
  autoStart?: boolean;
}

const SCANNER_CONFIG = {
  fps: 20,
  disableFlip: true,
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const edge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.max(200, Math.floor(edge * 0.72));
    return { width: size, height: size };
  },
} as const;

const CAMERA_CONSTRAINTS = {
  facingMode: "environment",
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
} as const;

async function stopScannerSafely(scanner: Html5Qrcode): Promise<void> {
  try {
    const state = scanner.getState();
    if (
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED
    ) {
      await scanner.stop();
    }
  } catch {
    // start ainda não concluiu ou câmera já foi encerrada
  }

  try {
    scanner.clear();
  } catch {
    // container já removido do DOM
  }
}

/**
 * Scanner com câmera traseira otimizada para leitura rápida em portaria.
 */
export function QrScanner({ onScan, locked = false, autoStart = true }: QrScannerProps) {
  const containerId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(autoStart);
  const lastScanRef = useRef<string>("");
  const lockedRef = useRef(locked);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  lockedRef.current = locked;

  useEffect(() => {
    if (!locked) {
      lastScanRef.current = "";
    }
  }, [locked]);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(containerId, {
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });

    setStarting(true);

    const startPromise = scanner
      .start(
        CAMERA_CONSTRAINTS,
        SCANNER_CONFIG,
        (decodedText) => {
          if (cancelled || lockedRef.current || decodedText === lastScanRef.current) {
            return;
          }

          lastScanRef.current = decodedText;
          onScanRef.current(decodedText);
        },
        () => {
          // ignora frames sem QR enquanto busca
        },
      )
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível acessar a câmera. Verifique as permissões do navegador.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStarting(false);
        }
      });

    return () => {
      cancelled = true;
      void startPromise.finally(() => stopScannerSafely(scanner));
    };
  }, [autoStart, containerId]);

  return (
    <Stack gap="sm">
      <div
        id={containerId}
        className="qr-scanner-viewport"
        aria-busy={starting || locked}
        hidden={Boolean(error)}
      />

      {error ? (
        <Alert color="red" icon={<IconCameraOff size={18} />} title="Câmera indisponível">
          {error}
        </Alert>
      ) : (
        <>
          <Text size="sm" c="dimmed" ta="center">
            {locked
              ? "Validando ingresso..."
              : starting
                ? "Iniciando câmera..."
                : "Centralize o QR code na área destacada"}
          </Text>
          {starting ? (
            <Center>
              <Text size="xs" c="dimmed">
                Permita o acesso à câmera se o navegador solicitar.
              </Text>
            </Center>
          ) : null}
        </>
      )}
    </Stack>
  );
}
