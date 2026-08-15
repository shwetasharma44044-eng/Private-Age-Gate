import React, { useEffect, useState } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Copy, Info, Loader2 } from 'lucide-react';
import { useDeployedAgeGateContext } from './hooks';
import { type AgeGateDeployment } from './contexts';
import { type AgeGateDerivedState } from '../../api/src/index';

const App: React.FC = () => {
  const ageGateManager = useDeployedAgeGateContext();
  const [activeContractAddress, setActiveContractAddress] = useState<string>('');
  const [deploymentState, setDeploymentState] = useState<AgeGateDeployment | null>(null);
  const [derivedState, setDerivedState] = useState<AgeGateDerivedState | null>(null);
  const [age, setAge] = useState<number>(18);
  const [threshold, setThreshold] = useState<number>(18);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [joinAddress, setJoinAddress] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Subscribe to deployments list to automatically resolve active state
  useEffect(() => {
    const sub = ageGateManager.ageGateDeployments$.subscribe({
      next: (deployments) => {
        if (deployments.length > 0) {
          const latestDeployment$ = deployments[deployments.length - 1];
          const sub2 = latestDeployment$.subscribe({
            next: (deployment) => {
              setDeploymentState(deployment);
              if (deployment.status === 'deployed') {
                setActiveContractAddress(deployment.api.deployedContractAddress);
              }
            },
          });
          return () => sub2.unsubscribe();
        }
      },
    });
    return () => sub.unsubscribe();
  }, [ageGateManager]);

  const handleDeploy = () => {
    setLoading(true);
    setError(null);
    ageGateManager.resolve().subscribe({
      next: (deployment) => {
        setDeploymentState(deployment);
        if (deployment.status === 'deployed') {
          setLoading(false);
          setActiveContractAddress(deployment.api.deployedContractAddress);
        } else if (deployment.status === 'failed') {
          setLoading(false);
          setError(deployment.error.message);
        }
      },
      error: (err) => {
        setLoading(false);
        setError(err.message || 'Deployment failed');
      },
    });
  };

  const handleJoin = () => {
    if (!joinAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }
    setLoading(true);
    setError(null);
    ageGateManager.resolve(joinAddress.trim()).subscribe({
      next: (deployment) => {
        setDeploymentState(deployment);
        if (deployment.status === 'deployed') {
          setLoading(false);
          setActiveContractAddress(deployment.api.deployedContractAddress);
        } else if (deployment.status === 'failed') {
          setLoading(false);
          setError(deployment.error.message);
        }
      },
      error: (err) => {
        setLoading(false);
        setError(err.message || 'Failed to join contract');
      },
    });
  };

  useEffect(() => {
    if (deploymentState?.status === 'deployed') {
      const sub = deploymentState.api.state$.subscribe({
        next: (state) => {
          setDerivedState(state);
        },
        error: (err) => {
          setError(err.message || 'Error loading contract state');
        },
      });
      return () => sub.unsubscribe();
    }
  }, [deploymentState]);

  const handleVerify = async () => {
    if (deploymentState?.status !== 'deployed') return;
    setLoading(true);
    setError(null);
    try {
      // Trigger the local ZK proof generation and submit transaction to the Midnight network ledger
      await deploymentState.api.verify(age, threshold);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Verification transaction failed. Ensure wallet is connected/authorized.');
    }
  };

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(activeContractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0c0e2b] to-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-sky-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-400 blur-xl opacity-50 rounded-full animate-pulse"></div>
              <Shield className="w-12 h-12 text-sky-400 relative z-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-500">
              Private Age Gate
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Prove you meet age requirements on the Midnight Network without doxxing your identity or revealing your true age.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl flex items-center shadow-lg shadow-red-500/5">
            <XCircle className="w-6 h-6 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Interaction Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-full flex flex-col">
              {deploymentState?.status !== 'deployed' ? (
                <div className="flex-1 space-y-8 flex flex-col justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="bg-sky-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-sky-500/30">
                      1
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">Connect & Select</h2>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed">
                    To start the zero-knowledge verification process, either deploy a new instance of the Age Gate contract, or join an existing session.
                  </p>

                  <div className="space-y-6">
                    <button
                      onClick={handleDeploy}
                      disabled={loading}
                      className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -ml-8 w-1/2"></div>
                      <span className="flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Deploy New Contract'}
                      </span>
                    </button>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-semibold uppercase tracking-wider">or join existing</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Paste contract address..."
                        value={joinAddress}
                        onChange={(e) => setJoinAddress(e.target.value)}
                        disabled={loading}
                        className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                      />
                      <button
                        onClick={handleJoin}
                        disabled={loading || !joinAddress.trim()}
                        className="sm:w-32 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl px-6 py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/30">
                        2
                      </div>
                      <h2 className="text-2xl font-bold text-slate-100">Verify Age</h2>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Connected
                    </div>
                  </div>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="min-w-0 mr-4">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Contract</p>
                      <p className="font-mono text-sm text-slate-300 truncate">{activeContractAddress}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                      title="Copy Address"
                    >
                      {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Your Exact Age (Private)</label>
                      <input
                        type="number"
                        min="1"
                        value={age}
                        onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                        disabled={loading}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Required Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={threshold}
                        onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 0))}
                        disabled={loading}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate ZK Proof & Verify'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-48 h-48" />
              </div>
              
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-8 relative z-10">Verification Status</h3>

              <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full">
                {loading ? (
                  <div className="space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                      <Lock className="w-8 h-8 text-sky-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sky-400 font-medium animate-pulse">Computing Zero-Knowledge Proof...</p>
                  </div>
                ) : derivedState?.isEligible ? (
                  <div className="space-y-6 w-full">
                    <div className="w-28 h-28 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30">
                      <CheckCircle className="w-14 h-14 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-extrabold text-emerald-400 mb-2">Eligible</h4>
                      <p className="text-slate-400">Proved age is ≥ {threshold}</p>
                    </div>
                    
                    <div className="mt-8 bg-black/30 rounded-2xl p-4 border border-white/5 text-left">
                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">Recorded On-Chain</p>
                      <p className="text-emerald-400 font-mono text-sm">
                        {derivedState.timestamp ? new Date(Number(derivedState.timestamp)).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-slate-500">
                    <div className="w-28 h-28 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center border-4 border-slate-700/50">
                      <XCircle className="w-14 h-14 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-400">Not Verified</h4>
                      <p className="text-slate-500 mt-2">Connect and run verification to see status</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Panel */}
          <div className="lg:col-span-12 mt-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center space-x-3 mb-8">
                <Lock className="w-6 h-6 text-sky-400" />
                <h3 className="text-xl font-bold text-white">Privacy Model Explained</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-sky-500/5 border border-sky-500/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-sky-500/10 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-5 h-5 text-sky-400" />
                    <h4 className="font-bold text-sky-400 tracking-wide">PRIVATE WITNESS (Local Only)</h4>
                  </div>
                  <ul className="space-y-3 text-slate-400 text-sm">
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-2">•</span>
                      <span><strong>Actual Age:</strong> Evaluated entirely on your device. Never transmitted to the ledger, a node, or any server.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-2">•</span>
                      <span><strong>Private Key:</strong> Remains securely in your local wallet to sign the intent.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-emerald-500/10 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <Info className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-emerald-400 tracking-wide">PUBLIC LEDGER (On-Chain)</h4>
                  </div>
                  <ul className="space-y-3 text-slate-400 text-sm">
                    <li className="flex items-start">
                      <span className="text-emerald-500 mr-2">•</span>
                      <span><strong>Eligibility Result:</strong> Only a boolean <code>true</code> is recorded, proving you met the threshold without leaking by how much.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-500 mr-2">•</span>
                      <span><strong>Wallet Identity:</strong> Public key that performed the verification.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
