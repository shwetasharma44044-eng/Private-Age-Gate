import React, { type PropsWithChildren, createContext } from 'react';
import { type DeployedAgeGateAPIProvider, BrowserDeployedAgeGateManager } from './BrowserDeployedBoardManager';
import { type Logger } from 'pino';

export const DeployedAgeGateContext = createContext<DeployedAgeGateAPIProvider | undefined>(undefined);

export type DeployedAgeGateProviderProps = PropsWithChildren<{
  logger: Logger;
}>;

export const DeployedAgeGateProvider: React.FC<Readonly<DeployedAgeGateProviderProps>> = ({ logger, children }) => (
  <DeployedAgeGateContext.Provider value={new BrowserDeployedAgeGateManager(logger)}>
    {children}
  </DeployedAgeGateContext.Provider>
);
