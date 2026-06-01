/**
 * @file Leitor de QR Code via câmera (html5-qrcode) para check-in de ingressos.
 * @module components/QrScanner
 */

import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button, Center, Stack, Text } from "@mantine/core";
import { Html5Qrcode } from "html5-qrcode";
import { IconCameraOff, IconScan } from "@tabler/icons-react";

/** Propriedades do scanner de QR para check-in. */
interface QrScannerProps {
  /** Chamado uma vez por leitura única (deduplica leituras repetidas). */
  onScan: (decodedText: string) => void;
  /** Pausa a câmera sem desmontar o componente. */
  paused?: boolean;
}

/**
 * Scanner com ativação manual da câmera traseira e tratamento de permissão negada.
 */
export function QrScanner({ onScan, paused = false }: QrScannerProps) {
  const containerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const lastScanRef = useRef<string>("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (paused || !active) {
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (cancelled || decodedText === lastScanRef.current) {
            return;
          }

          lastScanRef.current = decodedText;
          onScanRef.current(decodedText);
        },
        () => {
          // ignore scan failures while searching
        },
      )
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível acessar a câmera.",
          );
          setActive(false);
        }
      });

    return () => {
      cancelled = true;
      void scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => undefined);
      scannerRef.current = null;
    };
  }, [active, containerId, paused]);

  if (error) {
    return (
      <Alert color="red" icon={<IconCameraOff size={18} />} title="Câmera indisponível">
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      {!active ? (
        <Center py="md">
          <Button leftSection={<IconScan size={18} />} onClick={() => setActive(true)}>
            Ativar câmera
          </Button>
        </Center>
      ) : (
        <>
          <div
            id={containerId}
            style={{
              width: "100%",
              maxWidth: 360,
              margin: "0 auto",
              borderRadius: 8,
              overflow: "hidden",
            }}
          />
          <Text size="sm" c="dimmed" ta="center">
            Aponte para o QR code do ingresso
          </Text>
          <Center>
            <Button variant="light" color="gray" onClick={() => setActive(false)}>
              Desativar câmera
            </Button>
          </Center>
        </>
      )}
    </Stack>
  );
}
