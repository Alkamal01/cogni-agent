import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../shared';
import { AlertTriangleIcon } from './icons';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string) => void;
  isDeleting: boolean;
  error: string | null;
  sessionToDeleteId: string | null;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting, 
  error, 
  sessionToDeleteId 
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangleIcon />
          <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
            Delete Session
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this session? This action cannot be undone.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => sessionToDeleteId && onConfirm(sessionToDeleteId)}
            disabled={isDeleting || !sessionToDeleteId}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmationModal; 