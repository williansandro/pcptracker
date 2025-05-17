
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // O onAuthStateChanged cuidará de definir currentUser e redirecionar
      // O redirecionamento é tratado no ProtectedLayout
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = "Falha no login. Verifique suas credenciais.";
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = "E-mail ou senha inválidos.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Formato de e-mail inválido.";
      }
      console.error("Erro no login:", authError);
      toast({
        title: "Erro de Login",
        description: errorMessage,
        variant: "destructive",
      });
      throw authError; // Relançar para o formulário lidar com o estado de erro
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null); // Garante que o estado local é atualizado imediatamente
      router.push('/login'); // Redireciona para a página de login
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast({
        title: "Erro ao Sair",
        description: "Não foi possível realizar o logout.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthContextProvider');
  }
  return context;
};
