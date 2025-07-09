import React, { useState } from "react";
import { Code, Play, RefreshCw, Eye, Cpu, FileText } from "lucide-react";
import { LexicalAnalyzer } from "./compiler/LexicalAnalyzer";
import { SyntaxAnalyzer } from "./compiler/SyntaxAnalyzer";
import { CodeGenerator } from "./compiler/CodeGenerator";
import { PhaseIndicator } from "./compiler/PhaseIndicator";
import { AnalysisPanel } from "./compiler/AnalysisPanel";
import { FeatureShowcase } from "./compiler/FeatureShowcase";

export default function CCompiler() {
  const [sourceCode, setSourceCode] = useState(`#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 5;
    int y = 10;
    int result = add(x, y);
    printf("Result: %d\\n", result);
    
    if (result > 10) {
        printf("Result is greater than 10\\n");
    } else {
        printf("Result is less than or equal to 10\\n");
    }
    
    int i;
   
    
    return 0;
}`);

  const [outputLanguage, setOutputLanguage] = useState("java");
  const [compiledCode, setCompiledCode] = useState("");
  const [tokens, setTokens] = useState<any[]>([]);
  const [ast, setAST] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [compilerPhase, setCompilerPhase] = useState("source");
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compileCode = async () => {
    if (isCompiling || !sourceCode.trim()) return;
    
    setIsCompiling(true);
    setError(null);
    
    try {
      // Phase 1: Lexical Analysis
      setCompilerPhase("lexical");
      const lexer = new LexicalAnalyzer(sourceCode);
      const tokenList = lexer.tokenize();
      setTokens(tokenList);

      await new Promise(resolve => setTimeout(resolve, 800));

      // Phase 2: Syntax Analysis
      setCompilerPhase("syntax");
      const parser = new SyntaxAnalyzer(tokenList);
      const abstractSyntaxTree = parser.parse();
      setAST(abstractSyntaxTree);

      await new Promise(resolve => setTimeout(resolve, 800));

      // Phase 3: Code Generation
      setCompilerPhase("codegen");
      const generator = new CodeGenerator(abstractSyntaxTree);
      const output = outputLanguage === "java" ? generator.generateJava() : generator.generatePython();
      setCompiledCode(output);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setCompilerPhase("complete");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
      setCompiledCode(`Compilation Error: ${errorMessage}`);
      setError(errorMessage);
      setCompilerPhase("error");
    } finally {
      setIsCompiling(false);
    }
  };

  const clearCode = () => {
    setSourceCode("");
    setCompiledCode("");
    setTokens([]);
    setAST(null);
    setCompilerPhase("source");
    setError(null);
  };

  const getPhaseStatus = (phase: string) => {
    const phases = ["source", "lexical", "syntax", "codegen", "complete"];
    const currentIndex = phases.indexOf(compilerPhase);
    const phaseIndex = phases.indexOf(phase);
    
    if (compilerPhase === "error") return phaseIndex <= currentIndex ? "error" : "pending";
    if (currentIndex > phaseIndex) return "completed";
    if (currentIndex === phaseIndex) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Cpu className="text-white" size={28} />
                </div>
                C Language Compiler
              </h1>
              <p className="text-gray-600 mt-1 ml-14">
                Enhanced compiler with comprehensive C syntax support and code generation
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="java">☕ Java</option>
                <option value="python">🐍 Python</option>
              </select>
              
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  showAnalysis 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Eye size={16} />
                Analysis
              </button>
              
              <button
                onClick={compileCode}
                disabled={isCompiling || !sourceCode.trim()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed"
              >
                <Play size={16} className={isCompiling ? 'animate-spin' : ''} />
                {isCompiling ? 'Compiling...' : 'Compile'}
              </button>
              
              <button
                onClick={clearCode}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Compilation Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compilation Process */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Compilation Process</h3>
          <div className="flex items-center justify-center overflow-x-auto">
            <div className="flex items-center space-x-4 min-w-max">
              <PhaseIndicator 
                phase="source" 
                label="Source Code" 
                icon={FileText} 
                status={getPhaseStatus("source")} 
              />
              <PhaseIndicator 
                phase="lexical" 
                label="Lexical Analysis" 
                icon={Eye} 
                status={getPhaseStatus("lexical")} 
              />
              <PhaseIndicator 
                phase="syntax" 
                label="Syntax Analysis" 
                icon={Code} 
                status={getPhaseStatus("syntax")} 
              />
              <PhaseIndicator 
                phase="codegen" 
                label="Code Generation" 
                icon={Cpu} 
                status={getPhaseStatus("codegen")} 
              />
              <PhaseIndicator 
                phase="complete" 
                label="Complete" 
                icon={Play} 
                status={getPhaseStatus("complete")} 
                isLast 
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                <Code size={20} />
                C Source Code
              </h3>
            </div>
            <div className="p-6">
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="w-full h-96 bg-gray-900 text-green-400 font-mono text-sm p-6 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                placeholder="Enter your C code here..."
                style={{ lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className={`px-6 py-4 ${
              outputLanguage === 'java' 
                ? 'bg-gradient-to-r from-orange-600 to-red-600' 
                : 'bg-gradient-to-r from-blue-600 to-green-600'
            }`}>
              <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">
                  {outputLanguage === "java" ? "☕" : "🐍"}
                </span>
                {outputLanguage === "java" ? "Java" : "Python"} Output
              </h3>
            </div>
            <div className="p-6">
              <pre className="w-full h-96 bg-gray-900 text-yellow-400 font-mono text-sm p-6 rounded-xl overflow-auto">
                {compiledCode || 
                  `// ${outputLanguage === "java" ? "Java" : "Python"} code will appear here after compilation...`
                }
              </pre>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {showAnalysis && (
          <AnalysisPanel tokens={tokens} ast={ast} />
        )}

        {/* Features */}
        <FeatureShowcase />
      </div>
    </div>
  );
}