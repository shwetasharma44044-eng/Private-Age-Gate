import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { DeployedAgeGateContext, type DeployedAgeGateAPIProvider, type AgeGateDeployment } from '../contexts';
import { BehaviorSubject } from 'rxjs';
import { type AgeGateDerivedState } from '../../../api/src/index';

describe('Frontend UI', () => {
  it('renders the initial step to connect wallet & select contract', () => {
    const mockDeployments$ = new BehaviorSubject<Array<BehaviorSubject<AgeGateDeployment>>>([]);
    const mockResolve = vi.fn().mockImplementation(() => {
      const subject = new BehaviorSubject<AgeGateDeployment>({ status: 'in-progress' });
      return subject;
    });

    const mockProvider: DeployedAgeGateAPIProvider = {
      ageGateDeployments$: mockDeployments$,
      resolve: mockResolve,
    };

    render(
      <DeployedAgeGateContext.Provider value={mockProvider}>
        <App />
      </DeployedAgeGateContext.Provider>
    );

    expect(screen.getByText('Midnight Private Age Gate')).toBeInTheDocument();
    expect(screen.getByText('Connect & Select Contract')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deploy New Age Gate Contract' })).toBeInTheDocument();
  });

  it('updates UI to show Verification Status and input fields when contract is deployed', () => {
    const mockState$ = new BehaviorSubject<AgeGateDerivedState>({
      isEligible: false,
      timestamp: undefined,
      userPublicKey: '0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b',
    });

    const mockAPI = {
      deployedContractAddress: 'mock-contract-address',
      state$: mockState$,
      verify: vi.fn(),
    };

    const mockDeployments$ = new BehaviorSubject<Array<BehaviorSubject<AgeGateDeployment>>>([
      new BehaviorSubject<AgeGateDeployment>({
        status: 'deployed',
        api: mockAPI,
      })
    ]);

    const mockProvider: DeployedAgeGateAPIProvider = {
      ageGateDeployments$: mockDeployments$,
      resolve: vi.fn(),
    };

    render(
      <DeployedAgeGateContext.Provider value={mockProvider}>
        <App />
      </DeployedAgeGateContext.Provider>
    );

    expect(screen.getByText('Verify Age Eligibility')).toBeInTheDocument();
    expect(screen.getByText('mock-contract-address')).toBeInTheDocument();
    expect(screen.getByText('YOUR AGE (LOCAL WITNESS)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate ZK Proof & Verify' })).toBeInTheDocument();
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
  });

  it('renders the Eligible result badge when derivedState is eligible', () => {
    const mockState$ = new BehaviorSubject<AgeGateDerivedState>({
      isEligible: true,
      timestamp: 1718300000000n,
      userPublicKey: '0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b',
    });

    const mockAPI = {
      deployedContractAddress: 'mock-contract-address',
      state$: mockState$,
      verify: vi.fn(),
    };

    const mockDeployments$ = new BehaviorSubject<Array<BehaviorSubject<AgeGateDeployment>>>([
      new BehaviorSubject<AgeGateDeployment>({
        status: 'deployed',
        api: mockAPI,
      })
    ]);

    const mockProvider: DeployedAgeGateAPIProvider = {
      ageGateDeployments$: mockDeployments$,
      resolve: vi.fn(),
    };

    render(
      <DeployedAgeGateContext.Provider value={mockProvider}>
        <App />
      </DeployedAgeGateContext.Provider>
    );

    expect(screen.getByText('Eligible')).toBeInTheDocument();
    expect(screen.getByText(/Age verified on-chain/)).toBeInTheDocument();
  });
});
