import { useContext } from 'react';
import { DeployedAgeGateContext, type DeployedAgeGateAPIProvider } from '../contexts';

export const useDeployedAgeGateContext = (): DeployedAgeGateAPIProvider => {
  const context = useContext(DeployedAgeGateContext);

  if (!context) {
    throw new Error('A <DeployedAgeGateProvider /> is required.');
  }

  return context;
};
