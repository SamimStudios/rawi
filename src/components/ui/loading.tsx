// Centralized loading components export
export { LoadingSpinner } from './loading-spinner';
export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonListItem, 
  SkeletonTable 
} from './skeleton-loader';

// Loading states demo component for development/testing
import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { SkeletonCard, SkeletonListItem, SkeletonTable } from './skeleton-loader';

export const LoadingDemo = () => (
  <div className="space-y-8 p-8">
    <div>
      <h3 className="text-lg font-semibold mb-4">Loading Spinners</h3>
      <div className="flex gap-4 items-center">
        <LoadingSpinner size="sm" />
        <LoadingSpinner size="default" />
        <LoadingSpinner size="lg" />
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Skeleton Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Skeleton List Items</h3>
      <div className="border rounded-lg">
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold mb-4">Skeleton Table</h3>
      <div className="border rounded-lg">
        <SkeletonTable rows={3} />
      </div>
    </div>
  </div>
);