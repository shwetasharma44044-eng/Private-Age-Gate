import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
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
            }
          });
          return () => sub2.unsubscribe();
        }
      }
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
      }
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
      }
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
        }
      });
      return () => sub.unsubscribe();
    }
  }, [deploymentState]);

  const handleVerify = async () => {
    if (deploymentState?.status !== 'deployed') return;
    setLoading(true);
    setError(null);
    try {
      await deploymentState.api.verify(age, threshold);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Verification transaction failed. Ensure wallet is connected/authorized.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeContractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        background: 'radial-gradient(circle at 50% 50%, #0c0e2b 0%, #03040c 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        color: '#fff',
      }}
    >
      <Container maxWidth="md">
        {/* Title Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 1 }}>
            <ShieldIcon sx={{ fontSize: 40, color: '#38bdf8', mr: 1.5, filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#fff', fontFamily: 'system-ui' }}>
              Midnight Private Age Gate
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 500, mx: 'auto', mt: 1 }}>
            Prove you are above a required age threshold without revealing your actual age or doxxing your identity.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(127, 29, 29, 0.2)', color: '#fca5a5' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Main Interactive Card */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                borderRadius: 5,
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {deploymentState?.status !== 'deployed' ? (
                  /* STEP 1: Deploy or Join */
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#38bdf8', width: 28, height: 28, borderRadius: '50%', color: '#000', fontWeight: 'bold', mr: 1.5 }}>
                        1
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Connect & Select Contract
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
                      To start the private verification process, deploy a new instance of the Age Gate contract, or join an existing contract address.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Button
                        variant="contained"
                        onClick={handleDeploy}
                        disabled={loading}
                        fullWidth
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 16,
                          background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Deploy New Age Gate Contract'}
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                        <Divider sx={{ flex: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                        <Typography variant="caption" sx={{ mx: 2, color: '#475569', fontWeight: 600 }}>OR</Typography>
                        <Divider sx={{ flex: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                          placeholder="Enter contract address..."
                          value={joinAddress}
                          onChange={(e) => setJoinAddress(e.target.value)}
                          disabled={loading}
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleJoin}
                          disabled={loading}
                          sx={{
                            borderRadius: 3,
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            textTransform: 'none',
                            px: 3,
                            fontWeight: 600,
                            '&:hover': { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.05)' }
                          }}
                        >
                          Join
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  /* STEP 2: Age Input & Verification */
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#10b981', width: 28, height: 28, borderRadius: '50%', color: '#000', fontWeight: 'bold', mr: 1.5 }}>
                          2
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Verify Age Eligibility
                        </Typography>
                      </Box>
                      <Chip
                        label="Connected"
                        size="small"
                        icon={<CheckCircleIcon sx={{ '&&': { color: '#10b981' } }} />}
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      />
                    </Box>

                    {/* Contract Address Display */}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255, 255, 255, 0.02)', p: 1.5, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', mb: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mr: 1 }}>Contract:</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {activeContractAddress}
                      </Typography>
                      <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                        <IconButton onClick={copyToClipboard} size="small" sx={{ color: '#94a3b8' }}>
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, fontWeight: 600 }}>
                          YOUR AGE (LOCAL WITNESS)
                        </Typography>
                        <TextField
                          type="number"
                          value={age}
                          onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                          disabled={loading}
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, fontWeight: 600 }}>
                          MIN AGE THRESHOLD
                        </Typography>
                        <TextField
                          type="number"
                          value={threshold}
                          onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 0))}
                          disabled={loading}
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      onClick={handleVerify}
                      disabled={loading}
                      fullWidth
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 16,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate ZK Proof & Verify'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Results & Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
              {/* ZK Eligibility Badge */}
              <Paper
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 5,
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  p: 4,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 700, tracking: 1, mb: 3 }}>
                  VERIFICATION STATUS
                </Typography>

                {loading ? (
                  <Box sx={{ my: 2 }}>
                    <CircularProgress size={60} sx={{ color: '#38bdf8', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Generating ZK proof off-chain...
                    </Typography>
                  </Box>
                ) : derivedState?.isEligible ? (
                  <Box>
                    <CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>
                      Eligible
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                      Age verified on-chain as ≥ {threshold}
                    </Typography>
                    <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', px: 2, py: 1, borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>PROVED ON-CHAIN AT</Typography>
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>
                        {derivedState.timestamp ? new Date(Number(derivedState.timestamp)).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <CancelIcon sx={{ fontSize: 72, color: '#64748b', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#94a3b8', mb: 1 }}>
                      Not Verified
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Connect contract & verify eligibility to retrieve status
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>

          {/* Privacy Model Explanation Card */}
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(16px)',
                borderRadius: 5,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                p: 2,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LockIcon sx={{ color: '#38bdf8', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Privacy Model: How This Works
                  </Typography>
                </Box>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(56, 189, 248, 0.02)', border: '1px solid rgba(56, 189, 248, 0.05)', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center' }}>
                        <ShieldIcon sx={{ mr: 1, fontSize: 18 }} /> PRIVATE WITNESS (Stays Local)
                      </Typography>
                      <ul style={{ paddingLeft: 18, margin: 0, color: '#94a3b8', fontSize: 13.5, lineHeight: 1.6 }}>
                        <li><strong>Actual Age:</strong> Evaluated local-only by the contract circuit. Never transmitted to ledger, node, or indexer.</li>
                        <li><strong>Private Key:</strong> Kept in your local browser private state to sign the ZK proof intent.</li>
                      </ul>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.05)', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center' }}>
                        <InfoIcon sx={{ mr: 1, fontSize: 18 }} /> PUBLIC LEDGER (Visible On-Chain)
                      </Typography>
                      <ul style={{ paddingLeft: 18, margin: 0, color: '#94a3b8', fontSize: 13.5, lineHeight: 1.6 }}>
                        <li><strong>Eligibility Status:</strong> The boolean result (<code>true</code>) proves you are above the threshold.</li>
                        <li><strong>Wallet Public Key:</strong> Identifies that this wallet is eligible.</li>
                        <li><strong>Timestamp:</strong> Records when the ZK verification transaction occurred.</li>
                      </ul>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default App;
