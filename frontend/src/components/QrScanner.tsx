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
    // Leitura em tela cheia — sem qrbox — para não exigir alinhamento milimétrico.
    fps: mobile ? 30 : 20,
    disableFlip: false,
    ...(mobile
      ? {
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        }
      : {}),
  };
}

const CAMERA_CONSTRAINT_FALLBACKS: MediaTrackConstraints[] = [
  {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
  },
  { facingMode: { ideal: "environment" } },
  { facingMode: { ideal: "user" } },
  { facingMode: "user" },
  {},
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
  const available = cameras.filter((camera) => camera.id.trim().length > 0);
  const ranked: string[] = [];
  const back = available.find((camera) =>
    /back|rear|environment|trás|tras|traseira/i.test(camera.label),
  );
  const front = available.find((camera) =>
    /front|user|face|frontal|selfie/i.test(camera.label),
  );

  if (back) {
    ranked.push(back.id);
  }
  if (front) {
    ranked.push(front.id);
  }

  for (const camera of available) {
    if (!ranked.includes(camera.id)) {
      ranked.push(camera.id);
    }
  }

  return ranked;
}

async function ensureCameraPermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Requested device not found", "NotFoundError");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

async function buildCameraAttempts(): Promise<CameraConfig[]> {
  const attempts: CameraConfig[] = [];

  try {
    await ensureCameraPermission();
    const cameras = await Html5Qrcode.getCameras();
    attempts.push(...rankCameraIds(cameras));
  } catch {
    // Permissão negada ou enumeração indisponível — tenta constraints genéricas.
  }

  for (const fallback of CAMERA_CONSTRAINT_FALLBACKS) {
    const key = JSON.stringify(fallback);
    const alreadyListed = attempts.some(
      (attempt) => typeof attempt !== "string" && JSON.stringify(attempt) === key,
    );
    if (!alreadyListed) {
      attempts.push(fallback);
    }
  }

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
        focusMode?: string[];
      };

      const constraints: MediaTrackConstraints & {
        focusMode?: string;
        advanced?: Array<{ zoom?: number }>;
      } = {};

      const supportedFocusModes = capabilities.focusMode;
      if (Array.isArray(supportedFocusModes) && supportedFocusModes.includes("continuous")) {
        constraints.focusMode = "continuous";
      }

      const zoomRange = capabilities.zoom;
      if (
        zoomRange &&
        typeof zoomRange.max === "number" &&
        typeof zoomRange.min === "number" &&
        zoomRange.max > zoomRange.min
      ) {
        const span = zoomRange.max - zoomRange.min;
        const targetZoom = Math.min(
          zoomRange.max,
          Math.max(zoomRange.min, zoomRange.min + span * 0.45),
        );
        constraints.advanced = [{ zoom: targetZoom }];
      }

      if (constraints.focusMode || constraints.advanced) {
        await scanner.applyVideoConstraints(constraints);
      }
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

  if (!navigator.mediaDevices?.getUserMedia) {
    return "Este navegador não suporta acesso à câmera. Tente Chrome, Edge ou Firefox atualizado.";
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
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
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
                : "Aponte para o QR code — a leitura é automática"}
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
