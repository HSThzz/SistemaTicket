/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Chave pública do Mercado Pago para tokenização de cartão no front-end. */
  readonly VITE_MERCADOPAGO_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
