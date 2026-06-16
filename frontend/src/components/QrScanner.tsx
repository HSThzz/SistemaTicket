/**
 * @file Leitor de QR Code via câmera (html5-qrcode) para check-in de ingressos.
 * @module components/QrScanner
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Alert, Button, Center, Stack, Text } from "@mantine/core";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeCameraScanConfig,
} from "html5-qrcode";
import { IconCameraOff, IconScan } from "@tabler/icons-react";

/** Propriedades do scanner de QR para check-in. */
interface QrScannerProps {
  /** Chamado uma vez por leitura única (deduplica leituras repetidas). */
  onScan: (decodedText: string) => void;
  /** Bloqueia novas leituras sem desligar a câmera (ex.: durante API). */
  locked?: boolean;
}

type CameraConfig = string | MediaTrackConstraints;

function isMobileScanner(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

function buildScannerConfig(): Html5QrcodeCameraScanConfig {
  const mobile = isMobileScanner();

  return {
    fps: mobile ? 12 : 15,
    aspectRatio: 1,
    disableFlip: true,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.min(viewfinderWidth, viewfinderHeight);
      const ratio = mobile ? 0.8 : 0.72;
      const size = Math.max(180, Math.floor(edge * ratio));
      return { width: size, height: size };
    },
    videoConstraints: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
}

const CAMERA_CONSTRAINT_FALLBACKS: MediaTrackConstraints[] = [
  { facingMode: { ideal: "environment" } },
  { facingMode: "environment" },
  { facingMode: "user" },
];

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

function rankCameraIds(cameras: Array<{ id: string; label: string }>): string[] {
  const ranked: string[] = [];
  const back = cameras.find((camera) =>
    /back|rear|environment|trás|tras|traseira/i.test(camera.label),
  );
  const front = cameras.find((camera) =>
    /front|user|face|frontal|selfie/i.test(camera.label),
  );

  if (back) {
    ranked.push(back.id);
  }
  if (front) {
    ranked.push(front.id);
  }

  for (const camera of cameras) {
    if (!ranked.includes(camera.id)) {
      ranked.push(camera.id);
    }
  }

  return ranked;
}

async function buildCameraAttempts(): Promise<CameraConfig[]> {
  if (isMobileScanner()) {
    return CAMERA_CONSTRAINT_FALLBACKS;
  }

  const attempts: CameraConfig[] = [];

  try {
    const cameras = await Html5Qrcode.getCameras();
    attempts.push(...rankCameraIds(cameras));
  } catch {
    // segue para constraints genéricas
  }

  attempts.push(...CAMERA_CONSTRAINT_FALLBACKS);
  return attempts;
}

async function applyCameraEnhancements(scanner: Html5Qrcode): Promise<void> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    if (scanner.getState() !== Html5QrcodeScannerState.SCANNING) {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      continue;
    }

    try {
      const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
        zoom?: { min?: number; max?: number };
      };

      const constraints: MediaTrackConstraints & {
        focusMode?: string;
        advanced?: Array<{ zoom?: number }>;
      } = {
        focusMode: "continuous",
      };

      const zoomRange = capabilities.zoom;
      if (
        zoomRange &&
        typeof zoomRange.max === "number" &&
        typeof zoomRange.min === "number" &&
        zoomRange.max > zoomRange.min
      ) {
        const targetZoom = Math.min(Math.max(zoomRange.min, 1.4), zoomRange.max);
        constraints.advanced = [{ zoom: targetZoom }];
      }

      await scanner.applyVideoConstraints(constraints);
    } catch {
      // iOS/Safari não expõe zoom/focus em todos os dispositivos
    }

    return;
  }
}

function formatCameraError(error: unknown): string {
  if (!window.isSecureContext) {
    return "A câmera só funciona em HTTPS ou localhost. Abra o site por uma conexão segura.";
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("notallowed") ||
    normalized.includes("permission denied") ||
    normalized.includes("permission dismissed")
  ) {
    return "Permissão da câmera negada. No Chrome, toque no cadeado da barra de endereço e permita a câmera.";
  }

  if (normalized.includes("notfound") || normalized.includes("requested device not found")) {
    return "Nenhuma câmera foi encontrada neste dispositivo.";
  }

  if (normalized.includes("notreadable") || normalized.includes("could not start video source")) {
    return "A câmera está em uso por outro aplicativo. Feche outros apps e tente novamente.";
  }

  if (normalized.includes("overconstrained")) {
    return "Não foi possível usar a câmera disponível. Tente novamente ou use o código manual.";
  }

  if (message) {
    return message;
  }

  return "Não foi possível acessar a câmera. Verifique as permissões do navegador.";
}

async function startScannerWithFallback(
  scanner: Html5Qrcode,
  onSuccess: (decodedText: string) => void,
  onEmpty: () => void,
): Promise<void> {
  const attempts = await buildCameraAttempts();
  const config = buildScannerConfig();
  let lastError: unknown = new Error("Nenhuma câmera disponível.");

  for (const cameraConfig of attempts) {
    try {
      await scanner.start(cameraConfig, config, onSuccess, onEmpty);
      await applyCameraEnhancements(scanner);
      return;
    } catch (error) {
      lastError = error;
      await stopScannerSafely(scanner);
    }
  }

  throw lastError;
}

/**
 * Scanner com ativação manual da câmera (gesto do usuário) e leitura otimizada em portaria.
 */
export function QrScanner({ onScan, locked = false }: QrScannerProps) {
  const containerId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(0);
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
    if (!active) {
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(containerId, {
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });

    setStarting(true);
    setError(null);

    const startPromise = startScannerWithFallback(
      scanner,
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
          setError(formatCameraError(err));
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
  }, [active, containerId, session]);

  const handleActivate = useCallback(() => {
    setError(null);
    if (active) {
      setSession((current) => current + 1);
      return;
    }
    setActive(true);
  }, [active]);

  const handleDeactivate = useCallback(() => {
    setError(null);
    setActive(false);
  }, []);

  if (!active) {
    return (
      <Stack gap="sm">
        <Center py="md">
          <Button
            leftSection={<IconScan size={18} />}
            onClick={handleActivate}
            size="md"
            radius="xl"
          >
            Ativar câmera
          </Button>
        </Center>
        <Text size="sm" c="dimmed" ta="center">
          Toque para permitir o acesso à câmera do dispositivo.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <div
        id={containerId}
        className={`qr-scanner-viewport${starting ? " qr-scanner-viewport--starting" : ""}`}
        aria-busy={starting || locked}
        hidden={Boolean(error)}
      />

      {error ? (
        <Alert color="red" icon={<IconCameraOff size={18} />} title="Câmera indisponível">
          <Stack gap="sm">
            <Text size="sm">{error}</Text>
            <Button
              variant="light"
              color="red"
              leftSection={<IconScan size={16} />}
              onClick={handleActivate}
            >
              Tentar novamente
            </Button>
          </Stack>
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

      <Center>
        <Button variant="light" color="gray" onClick={handleDeactivate}>
          Desativar câmera
        </Button>
      </Center>
    </Stack>
  );
}
