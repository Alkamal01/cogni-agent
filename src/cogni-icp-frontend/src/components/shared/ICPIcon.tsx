import React from 'react';

interface ICPIconProps {
  className?: string;
  size?: number;
}

const ICPIcon: React.FC<ICPIconProps> = ({ className = "h-6 w-6", size = 24 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ICP Logo - Internet Computer Protocol */}
      <circle cx="12" cy="12" r="11" fill="#29ABE2" />
      <circle cx="12" cy="12" r="9" fill="white" />
      <circle cx="12" cy="12" r="7" fill="#29ABE2" />
      <circle cx="12" cy="12" r="5" fill="white" />
      <circle cx="12" cy="12" r="3" fill="#29ABE2" />
      <circle cx="12" cy="12" r="1" fill="white" />
    </svg>
  );
};

export default ICPIcon;
