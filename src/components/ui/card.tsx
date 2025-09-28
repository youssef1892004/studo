
import React from 'react';

const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {children}
    </div>
  );
};

export default Card;
