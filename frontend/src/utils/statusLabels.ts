import type { BadgeProps } from "@mantine/core";

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PAID":
      return "Pago";
    case "FAILED":
      return "Falhou";
    case "REFUNDED":
      return "Reembolsado";
    default:
      return status;
  }
}

export function getOrderStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "PENDING":
      return "yellow";
    case "PAID":
      return "green";
    case "FAILED":
      return "red";
    case "REFUNDED":
      return "gray";
    default:
      return "gray";
  }
}

export function getTicketStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Ativo";
    case "USED":
      return "Utilizado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

export function getTicketStatusColor(status: string): BadgeProps["color"] {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "USED":
      return "blue";
    case "CANCELLED":
      return "red";
    default:
      return "gray";
  }
}
