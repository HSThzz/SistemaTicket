/**
 * @file Contexto React de autenticação com bootstrap de sessão e logout em 401.
 * @module context/AuthContext
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "../features/identity/api/authService";
import { api, getAuthToken, setAuthToken } from "../shared/api/client";
import type { AuthUser } from "../types/api";

/** Valor exposto pelo contexto de autenticação. */
interface AuthContextValue {
  /** Perfil carregado após bootstrap ou login. */
  user: AuthUser | null;
  /** JWT persistido localmente. */
  token: string | null;
  /** `true` quando token e usuário estão presentes. */
  isAuthenticated: boolean;
  /** `true` enquanto valida token salvo com a API. */
  isBootstrapping: boolean;
  /** Define token e usuário após login/cadastro. */
  setSession: (token: string, user: AuthUser) => void;
  /** Remove sessão local e estado em memória. */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provedor que restaura sessão do token salvo, valida com `/auth/me` e limpa em 401.
 *
 * @param props.children - Árvore de componentes da aplicação.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAuthToken()));

  const setSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "isAxiosError" in error &&
          (error as { response?: { status?: number } }).response?.status === 401
        ) {
          clearSession();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    authService
      .getMe()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      setSession,
      clearSession,
    }),
    [user, token, isBootstrapping, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acessar usuário, token e ações de sessão.
 *
 * @throws Se usado fora de {@link AuthProvider}.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
