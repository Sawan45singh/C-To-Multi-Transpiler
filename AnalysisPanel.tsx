import React from "react";

interface AnalysisPanelProps {
  tokens: any[];
  ast: any;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ tokens, ast }) => {
  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Compiler Analysis</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Lexical Tokens
            </h4>
            <div className="bg-gray-900 p-4 rounded-xl h-64 overflow-auto">
              {tokens.map((token: any, index) => (
                <div key={index} className="text-sm mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="text-blue-400 font-medium min-w-20">{token.type}</span>
                  <span className="text-gray-400">:</span>
                  <span className="text-green-400">
                    {token.value || "EOF"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Abstract Syntax Tree
            </h4>
            <div className="bg-gray-900 p-4 rounded-xl h-64 overflow-auto">
              <pre className="text-sm text-purple-400 leading-relaxed">
                {ast
                  ? JSON.stringify(ast, null, 2)
                  : "AST will appear after parsing..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
