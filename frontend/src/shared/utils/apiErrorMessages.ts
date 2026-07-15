/**
 * @file Mensagens amigáveis em português para códigos de erro da API.
 * @module shared/utils/apiErrorMessages
 */

/** Tradução estável de `code` → texto exibido ao usuário. */
export const API_ERROR_MESSAGES: Record<string, string> = {
  // Infra / HTTP
  VALIDATION_ERROR: "Os dados enviados são inválidos. Verifique os campos e tente novamente.",
  UNAUTHORIZED: "Você precisa estar autenticado para continuar.",
  TOKEN_REVOKED: "Sua sessão expirou. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  RATE_LIMIT_EXCEEDED: "Muitas tentativas em pouco tempo. Aguarde um momento e tente de novo.",
  INTERNAL_ERROR: "Algo deu errado do nosso lado. Tente novamente em instantes.",
  NOT_FOUND: "Recurso não encontrado.",
  INVALID_ORDER_ID: "Identificador do pedido inválido.",
  HEALTH_CHECK_FAILED: "O serviço está temporariamente indisponível.",
  WORKER_NOT_RUNNING: "Serviço interno indisponível no momento. Tente novamente mais tarde.",

  // Identidade
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  EMAIL_ALREADY_EXISTS: "Este e-mail já está cadastrado.",
  DOCUMENT_ALREADY_EXISTS: "Este CPF já está cadastrado.",
  CURRENT_PASSWORD_REQUIRED: "Informe sua senha atual para confirmar a alteração.",
  LAST_SUPER_ADMIN_PROTECTION: "Não é possível remover o último super administrador da plataforma.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  INVALID_CURRENT_PASSWORD: "Senha atual incorreta.",
  PASSWORD_REUSE: "A nova senha deve ser diferente da senha atual.",
  INVALID_PASSWORD_RESET_TOKEN: "Link de redefinição inválido ou expirado. Solicite um novo e-mail.",
  INVALID_ROLE: "Perfil de usuário inválido.",
  ADMIN_SELF_PASSWORD_RESET_FORBIDDEN: "Para alterar sua própria senha, use a página de perfil.",
  ADMIN_PASSWORD_RESET_FORBIDDEN: "Apenas super administradores podem redefinir senha de administradores.",
  ROLE_ASSIGNMENT_FORBIDDEN: "Apenas super administradores podem alterar perfis de usuário.",

  // Catálogo
  EVENT_NOT_FOUND: "Evento não encontrado.",
  EVENT_ACCESS_DENIED: "Você não tem permissão para gerenciar este evento.",
  EVENT_INVALID_STATUS_TRANSITION: "Não é possível alterar o status do evento desta forma.",
  EVENT_CANNOT_DELETE: "Só é possível remover eventos cancelados ou finalizados.",
  EVENT_NOT_EDITABLE: "O evento não pode ser editado no status atual.",
  EVENT_LOT_NOT_ALLOWED: "Não é possível criar lotes de ingressos neste status do evento.",
  EVENT_PUBLISH_MISSING_LOTS: "Para publicar, cadastre pelo menos um lote de ingressos.",
  EVENT_PUBLISH_PAST_DATE: "Não é possível publicar um evento com data no passado.",
  TICKET_LOT_NOT_FOUND: "Lote de ingressos não encontrado.",
  TICKET_LOT_HAS_SALES: "Não é possível excluir um lote que já teve ingressos emitidos.",
  TICKET_LOT_HAS_PENDING_RESERVATIONS: "Não é possível excluir um lote com reservas pendentes.",
  TICKET_LOT_LAST_OF_PUBLISHED_EVENT: "Evento publicado precisa manter pelo menos um lote de ingressos.",
  LOT_PRICE_LOCKED:
    "Não é possível alterar o preço deste lote enquanto houver reservas pendentes ou ingressos emitidos.",
  LOT_QUANTITY_DECREASE_FORBIDDEN:
    "A quantidade total do lote só pode ser aumentada, não reduzida.",
  EVENT_TYPE_CHANGE_NOT_DRAFT: "O tipo do evento só pode ser alterado enquanto estiver em rascunho.",
  EVENT_TYPE_CHANGE_HAS_PARTICIPATION_REQUESTS:
    "Não é possível alterar o tipo após solicitações de participação.",
  EVENT_TYPE_CHANGE_HAS_COMMERCIAL_ACTIVITY:
    "Não é possível alterar o tipo após reservas ou vendas de ingressos.",

  // Participação
  EVENT_NOT_PRIVATE: "Solicitações de participação são apenas para eventos privados.",
  EVENT_NOT_ACCEPTING_PARTICIPATION: "Este evento não está aceitando novas solicitações.",
  EVENT_NOT_REVIEWABLE: "Não é possível revisar solicitações com o evento neste status.",
  PARTICIPATION_ALREADY_REQUESTED: "Você já enviou uma solicitação de participação para este evento.",
  PARTICIPATION_REJECTED: "Sua solicitação anterior foi recusada e não pode ser reenviada.",
  PARTICIPATION_REQUEST_NOT_FOUND: "Solicitação de participação não encontrada.",
  PARTICIPATION_ACCESS_DENIED: "Você não tem permissão para gerenciar solicitações deste evento.",
  PARTICIPATION_ALREADY_REVIEWED: "Esta solicitação já foi analisada.",
  PARTICIPATION_INVALID_TICKET_LOTS:
    "Um ou mais lotes selecionados são inválidos para este evento.",
  PARTICIPATION_NO_TICKET_LOTS:
    "Crie ao menos um lote de ingressos antes de aprovar solicitações.",

  // Vendas
  LOCK_NOT_ACQUIRED: "Muitas pessoas estão comprando agora. Tente novamente em instantes.",
  INSUFFICIENT_STOCK: "Não há ingressos suficientes disponíveis.",
  INVALID_QUANTITY: "Quantidade de ingressos inválida.",
  RESERVATION_NOT_FOUND: "Reserva não encontrada ou expirada.",
  RESERVATION_ACCESS_DENIED: "Você não tem acesso a esta reserva.",
  PARTICIPATION_NOT_APPROVED:
    "Em eventos privados, sua participação precisa ser aprovada antes da compra.",
  PARTICIPATION_LOT_NOT_ALLOWED:
    "Sua aprovação não inclui este lote. Escolha um dos lotes liberados para você.",
  EVENT_NOT_ON_SALE: "Este evento não está disponível para compra.",
  PENDING_ORDER_EXISTS:
    "Você já tem um pedido pendente. Pague ou aguarde a expiração antes de reservar de novo.",

  // Pagamento
  ORDER_NOT_FOUND: "Pedido não encontrado.",
  INVALID_WEBHOOK_PAYLOAD: "Notificação de pagamento inválida.",
  FREE_ORDER_PAYMENT_NOT_ALLOWED: "Este pedido é gratuito e não requer pagamento.",
  PAYMENT_ALREADY_PROCESSED: "Este pedido já foi processado.",
  CARD_PAYMENT_UNSUPPORTED: "Pagamento com cartão não está disponível no momento.",
  PAYMENT_GATEWAY_ERROR: "Não foi possível processar o pagamento. Tente novamente.",
  WEBHOOK_UNAUTHORIZED: "Notificação de pagamento não autorizada.",
  WEBHOOK_REPLAY: "Esta notificação de pagamento já foi processada.",
  ORDER_NOT_REFUNDABLE: "Este pedido não pode ser reembolsado no momento.",
  ORDER_ALREADY_REFUNDED: "Este pedido já foi reembolsado.",
  PAYMENT_AMOUNT_MISMATCH: "Valor do pagamento não confere com o pedido.",
  REFUND_LOCAL_STATE_ERROR:
    "Reembolso processado, mas houve falha ao atualizar o sistema. Entre em contato com o suporte.",
  TICKET_ALREADY_USED: "Não é possível reembolsar um pedido com ingressos já utilizados.",
  PIX_NOT_AVAILABLE: "PIX não disponível para este pedido.",
  MERCADOPAGO_INVALID_PAYER_EMAIL:
    "E-mail inválido para pagamento. Cadastre um e-mail válido no seu perfil.",
  MERCADOPAGO_INVALID_PAYER_DOCUMENT:
    "CPF/CNPJ inválido para pagamento. Atualize seu documento no perfil.",
  MERCADOPAGO_PIX_UNAVAILABLE: "Não foi possível gerar o PIX. Tente novamente.",
  MERCADOPAGO_INVALID_PAYMENT: "Pagamento inválido no gateway.",
  MERCADOPAGO_API_ERROR: "Erro na comunicação com o gateway de pagamento. Tente novamente.",

  // Check-in / carteira / emissão
  TICKET_NOT_FOUND: "Ingresso não encontrado.",
  INVALID_TICKET_STATUS: "Este ingresso não pode ser validado no momento.",
  EVENT_NOT_PUBLISHED: "O evento não está disponível para check-in.",
  CHECKIN_NOT_ALLOWED_TODAY: "Check-in permitido apenas no dia do evento.",
  CHECKIN_ACCESS_DENIED: "Você não tem permissão para validar ingressos deste evento.",
  WALLET_CONFIG_ERROR: "Carteira digital temporariamente indisponível.",
  MANUAL_TICKET_FORBIDDEN: "Apenas super administradores podem emitir ingressos manualmente.",
  MANUAL_TICKET_USER_NOT_FOUND: "Usuário não encontrado.",
  MANUAL_TICKET_LOT_NOT_FOUND: "Lote de ingressos não encontrado.",
  MANUAL_TICKET_INSUFFICIENT_STOCK: "Estoque insuficiente neste lote.",
  MANUAL_TICKET_EVENT_NOT_ISSUABLE: "Não é possível emitir ingressos para evento neste status.",

  // Equipe de portaria
  CHECK_IN_STAFF_USER_NOT_FOUND: "Nenhuma conta encontrada com este e-mail.",
  CHECK_IN_STAFF_ALREADY_EXISTS: "Esta pessoa já está na equipe de portaria.",
  CHECK_IN_STAFF_IS_EVENT_OWNER: "O dono do evento já tem acesso ao check-in.",
  CHECK_IN_STAFF_NOT_FOUND: "Membro da equipe de portaria não encontrado.",

  // Spotify
  SPOTIFY_NOT_CONFIGURED: "Integração com Spotify não está configurada.",
  SPOTIFY_NOT_CONNECTED: "Sua conta Spotify não está conectada.",
  SPOTIFY_OAUTH_FAILED: "Não foi possível conectar com o Spotify. Tente novamente.",
};

/**
 * Resolve mensagem amigável a partir do código da API.
 * @returns Texto em português ou `null` se o código for desconhecido.
 */
export function resolveApiErrorMessage(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }

  return API_ERROR_MESSAGES[code] ?? null;
}
