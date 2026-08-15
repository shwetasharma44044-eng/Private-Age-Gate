import './globals';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import '@midnight-ntwrk/dapp-connector-api';
import * as pino from 'pino';
import { DeployedAgeGateProvider } from './contexts';

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
setNetworkId(networkId);

export const logger = pino.pino({
  level: import.meta.env.VITE_LOGGING_LEVEL as string,
});

logger.trace(`networkId = ${networkId}`);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DeployedAgeGateProvider logger={logger}>
      <App />
    </DeployedAgeGateProvider>
  </React.StrictMode>,
);
