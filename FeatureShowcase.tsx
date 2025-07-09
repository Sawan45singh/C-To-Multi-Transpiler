import React from "react";
import { Eye, Code, Cpu } from "lucide-react";

export const FeatureShowcase: React.FC = () => {
  const features = [
    {
      title: "Lexical Analysis",
      icon: Eye,
      features: ["Comment Handling", "String & Char Literals", "Multi-char Operators", "Enhanced Tokenization"],
      color: "blue"
    },
    {
      title: "Syntax Analysis", 
      icon: Code,
      features: ["Control Structures", "Function Bodies", "Expression Parsing", "Block Statements"],
      color: "green"
    },
    {
      title: "Code Generation",
      icon: Cpu,
      features: ["Complete Java/Python", "Loop Translation", "Function Calls", "I/O Operations"],
      color: "purple"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          border: 'border-blue-100',
          bg: 'bg-blue-50/50',
          iconBg: 'bg-blue-500',
          dot: 'bg-blue-500'
        };
      case 'green':
        return {
          border: 'border-green-100',
          bg: 'bg-green-50/50',
          iconBg: 'bg-green-500',
          dot: 'bg-green-500'
        };
      case 'purple':
        return {
          border: 'border-purple-100',
          bg: 'bg-purple-50/50',
          iconBg: 'bg-purple-500',
          dot: 'bg-purple-500'
        };
      default:
        return {
          border: 'border-gray-100',
          bg: 'bg-gray-50/50',
          iconBg: 'bg-gray-500',
          dot: 'bg-gray-500'
        };
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
        Enhanced Compiler Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const colors = getColorClasses(feature.color);
          return (
            <div key={index} className={`p-6 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
              <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon size={24} className="text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-3">{feature.title}</h4>
              <ul className="space-y-2">
                {feature.features.map((item, i) => (
                  <li key={i} className="text-gray-600 text-sm flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full`}></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};