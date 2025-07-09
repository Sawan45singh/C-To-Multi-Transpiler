import React from "react";
import { LucideIcon } from "lucide-react";

interface PhaseIndicatorProps {
  phase: string;
  label: string;
  icon: LucideIcon;
  status: "pending" | "active" | "completed" | "error";
  isLast?: boolean;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ 
  phase, 
  label, 
  icon: Icon, 
  status, 
  isLast = false 
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 shadow-lg shadow-emerald-500/30';
      case 'active':
        return 'bg-blue-500 shadow-lg shadow-blue-500/30 animate-pulse';
      case 'error':
        return 'bg-red-500 shadow-lg shadow-red-500/30';
      default:
        return 'bg-gray-600';
    }
  };

  const getLabelClasses = () => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400';
      case 'active':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectorClasses = () => {
    return status === 'completed' ? 'bg-emerald-500' : 'bg-gray-600';
  };

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`
          relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 
          ${getStatusClasses()}
        `}>
          <Icon size={20} className="text-white" />
          {status === 'active' && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping"></div>
          )}
        </div>
        <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${getLabelClasses()}`}>
          {label}
        </span>
      </div>
      {!isLast && (
        <div className={`w-16 h-0.5 mx-4 transition-colors duration-500 ${getConnectorClasses()}`}></div>
      )}
    </div>
  );
};
