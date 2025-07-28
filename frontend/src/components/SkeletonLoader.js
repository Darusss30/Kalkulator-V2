import React from 'react';

export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex space-x-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 bg-gray-200 rounded w-24"></div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="h-12 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
};

export const MaterialCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mr-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16 mr-2"></div>
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );
};
