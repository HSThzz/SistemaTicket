export type QuantityValidationIssue = "sold_out" | "below_min" | "above_max";

export type QuantityValidation =
  | { valid: true; quantity: number; maxAvailable: number }
  | {
      valid: false;
      issue: QuantityValidationIssue;
      quantity: number;
      maxAvailable: number;
    };

export function normalizeTicketQuantity(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.floor(parsed);
}

export function validateTicketQuantity(
  quantity: number,
  maxAvailable: number,
): QuantityValidation {
  const max = Math.max(0, Math.floor(maxAvailable));
  const normalized = normalizeTicketQuantity(quantity);

  if (max === 0) {
    return { valid: false, issue: "sold_out", quantity: normalized, maxAvailable: max };
  }

  if (normalized < 1) {
    return { valid: false, issue: "below_min", quantity: normalized, maxAvailable: max };
  }

  if (normalized > max) {
    return { valid: false, issue: "above_max", quantity: normalized, maxAvailable: max };
  }

  return { valid: true, quantity: normalized, maxAvailable: max };
}

export function getQuantityValidationMessage(validation: QuantityValidation): string {
  if (validation.valid) {
    return "";
  }

  switch (validation.issue) {
    case "sold_out":
      return "Este lote está esgotado. Escolha outro lote ou evento.";
    case "below_min":
      return "Informe pelo menos 1 ingresso.";
    case "above_max":
      return `Só há ${validation.maxAvailable} ingresso${validation.maxAvailable === 1 ? "" : "s"} disponíve${validation.maxAvailable === 1 ? "l" : "is"} neste lote. Você selecionou ${validation.quantity}.`;
    default:
      return "Quantidade inválida.";
  }
}

export function getBillableQuantity(validation: QuantityValidation): number {
  if (validation.valid) {
    return validation.quantity;
  }

  if (validation.issue === "above_max") {
    return validation.maxAvailable;
  }

  return 0;
}
