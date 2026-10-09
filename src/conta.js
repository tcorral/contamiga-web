import { createContext, useContext } from "react";

export const Conta = createContext(null);

export function useConta() {
  return useContext(Conta);
}
