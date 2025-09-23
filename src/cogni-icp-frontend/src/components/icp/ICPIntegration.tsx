import React, { useState, useEffect } from 'react';
import { icpService } from '../../services/icpService';
import { Card, Button, Input, Loading } from '../shared';

interface ICPIntegrationProps {
  className?: string;
}

export const ICPIntegration: React.FC<ICPIntegrationProps> = ({ className = '' }) => {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [newPrincipal, setNewPrincipal] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [canisterStatus, setCanisterStatus] = useState<any>(null);
  const [onChainAchievements, setOnChainAchievements] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current principal
      const principalData = await icpService.getPrincipal();
      setPrincipal(principalData.principal);

      // Load canister status
      const status = await icpService.getCanisterStatus();
      setCanisterStatus(status);

      // Load on-chain achievements if principal is linked
      if (principalData.principal) {
        const achievements = await icpService.getOnChainAchievements();
        setOnChainAchievements(achievements);
      }
    } catch (error) {
      console.error('Error loading ICP data:', error);
      showMessage('error', 'Failed to load ICP data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLinkPrincipal = async () => {
    if (!newPrincipal.trim()) {
      showMessage('error', 'Please enter a principal');
      return;
    }

    setLoading(true);
    try {
      const result = await icpService.linkPrincipal(newPrincipal.trim());
      if (result.success) {
        setPrincipal(newPrincipal.trim());
        setNewPrincipal('');
        showMessage('success', 'Principal linked successfully');
        loadData(); // Reload data
      } else {
        showMessage('error', result.error || 'Failed to link principal');
      }
    } catch (error) {
      showMessage('error', 'Failed to link principal');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkPrincipal = async () => {
    setLoading(true);
    try {
      const result = await icpService.unlinkPrincipal();
      if (result.success) {
        setPrincipal(null);
        setOnChainAchievements([]);
        showMessage('success', 'Principal unlinked successfully');
      } else {
        showMessage('error', result.error || 'Failed to unlink principal');
      }
    } catch (error) {
      showMessage('error', 'Failed to unlink principal');
    } finally {
      setLoading(false);
    }
  };

  const handleInternetIdentityLogin = async () => {
    setLoading(true);
    try {
      const { internetIdentityService } = await import('../../services/internetIdentityService');
      
      // Initialize the service
      await internetIdentityService.init();
      
      // Complete the login flow
      const result = await internetIdentityService.completeLogin();
      
      if (result.success && result.user) {
        showMessage('success', 'Internet Identity authentication successful');
        
        // Update the principal
        const user = await internetIdentityService.getCurrentUser();
        if (user) {
          setPrincipal(user.principalText);
        }
        
        // Reload data
        loadData();
      } else {
        showMessage('error', result.error || 'Internet Identity authentication failed');
      }
    } catch (error) {
      showMessage('error', 'Internet Identity authentication failed');
      console.error('II auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestAchievement = async () => {
    setLoading(true);
    try {
      const result = await icpService.createTestAchievement({
        title: 'ICP Test Achievement',
        description: 'This is a test achievement created via ICP integration',
        type: 'icp_test',
        points: 100
      });
      
      if (result.success) {
        showMessage('success', 'Test achievement created successfully');
        // Reload achievements
        setTimeout(loadData, 2000); // Give time for on-chain processing
      } else {
        showMessage('error', result.error || 'Failed to create test achievement');
      }
    } catch (error) {
      showMessage('error', 'Failed to create test achievement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !principal && !canisterStatus) {
    return <Loading />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🔗</span>
          ICP Integration
        </h3>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Canister Status */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Canister Status</h4>
          {canisterStatus ? (
            <div className={`p-3 rounded-md ${
              canisterStatus.configured 
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  canisterStatus.configured ? 'bg-green-500' : 'bg-yellow-500'
                }`}></span>
                {canisterStatus.configured ? 'Connected' : 'Not Configured'}
              </div>
              {canisterStatus.canister_id && (
                <div className="text-sm text-gray-600 mt-1">
                  Canister ID: {canisterStatus.canister_id}
                </div>
              )}
              {canisterStatus.network && (
                <div className="text-sm text-gray-600">
                  Network: {canisterStatus.network}
                </div>
              )}
              {canisterStatus.error && (
                <div className="text-sm text-red-600 mt-1">
                  Error: {canisterStatus.error}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
              Loading canister status...
            </div>
          )}
        </div>

        {/* Principal Management */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Internet Identity Principal</h4>
          {principal ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-gray-600">Current Principal:</div>
                <div className="font-mono text-sm break-all">{principal}</div>
              </div>
              <Button
                onClick={handleUnlinkPrincipal}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Unlinking...' : 'Unlink Principal'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                No principal linked. Link your Internet Identity principal to enable on-chain features.
              </div>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter Internet Identity principal"
                  value={newPrincipal}
                  onChange={(e) => setNewPrincipal(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleLinkPrincipal}
                  disabled={loading || !newPrincipal.trim()}
                  size="sm"
                >
                  {loading ? 'Linking...' : 'Link'}
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                Note: In a real implementation, this would use Internet Identity authentication
              </div>
            </div>
          )}
        </div>

        {/* On-Chain Achievements */}
        {principal && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">On-Chain Achievements</h4>
            {onChainAchievements.length > 0 ? (
              <div className="space-y-2">
                {onChainAchievements.map((achievement, index) => (
                  <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="text-sm font-medium">Achievement #{achievement.id}</div>
                    <div className="text-xs text-gray-600">
                      Type: {achievement.achievement_type} | 
                      ID: {achievement.achievement_id} |
                      Hash: {achievement.metadata_hash.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                No on-chain achievements found
              </div>
            )}
          </div>
        )}

        {/* Internet Identity Authentication */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Internet Identity Authentication</h4>
          <div className="space-y-3">
            <Button
              onClick={handleInternetIdentityLogin}
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Login with Internet Identity'}
            </Button>
            <div className="text-xs text-gray-500">
              This will authenticate with Internet Identity and link your principal automatically
            </div>
          </div>
        </div>

        {/* Test Actions */}
        {canisterStatus?.configured && (
          <div>
            <h4 className="font-medium mb-2">Test Actions</h4>
            <div className="space-y-2">
              <Button
                onClick={handleCreateTestAchievement}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Test Achievement'}
              </Button>
              <div className="text-xs text-gray-500">
                This will create a test achievement and attempt to issue it on-chain
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ICPIntegration;
