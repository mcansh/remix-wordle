import * as React from "react";

let NonceContext = React.createContext<string | undefined>(undefined);

export function NonceProvider({
  nonce,
  children,
}: {
  nonce: string;
  children: React.ReactNode;
}) {
  return (
    <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
  );
}

export function useNonce() {
  return React.useContext(NonceContext);
}
