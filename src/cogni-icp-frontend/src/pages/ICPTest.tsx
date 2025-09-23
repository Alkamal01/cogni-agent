import React from 'react';
import { ICPIntegration } from '../components/icp';

const ICPTest: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ICP Integration Test
          </h1>
          <p className="text-gray-600">
            Test the Internet Computer Protocol integration for on-chain achievement attestations.
          </p>
        </div>

        <ICPIntegration />

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">How it works:</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Off-chain verification:</strong> Python backend handles authentication, business logic, AI interactions, and full metadata storage.
              </div>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>On-chain attestation:</strong> After verification, minimal achievement records (principal, type, hash, timestamp) are stored on the ICP canister.
              </div>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Principal linking:</strong> Users link their Internet Identity principal to enable on-chain features.
              </div>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Cost efficiency:</strong> Only tiny attestation records on-chain, full data stays off-chain for cost optimization.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICPTest;
