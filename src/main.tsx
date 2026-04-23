import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  initiaPrivyWalletConnector,
  injectStyles,
  InterwovenKitProvider,
  TESTNET,
} from "@initia/interwovenkit-react";
// @ts-ignore
import css from "@initia/interwovenkit-react/styles.css?inline";
import "./index.css";
import { App } from "./App";
import { GAME_CHAIN_ID } from "./lib/chain";

injectStyles(css);

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider {...TESTNET} defaultChainId={GAME_CHAIN_ID}>
          <div className="grain" />
          <App />
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
