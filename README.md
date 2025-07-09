# C-To-Multi-Transpiler

C to Multi Transpiler is a source-to-source transpiler to convert the code written in C language to Java and Python. It is made to guide students, educators and developers on how representation of C programs can be done in other high level languages without loss of logic and structure.

# Compiler Architecture

The project follows a classic multi-phase compilation model with three main modules:  
LexicalAnalyzer – Tokenizes the input C code into meaningful symbols.  
SyntaxAnalyzer – Parses tokens to build an Abstract Syntax Tree (AST).  
CodeGenerator – Traverses the AST to generate equivalent Java and Python code.  

# Frontend Interface

The UI is developed using React and provides a smooth, visualized compilation flow using:  
AnalysisPanel – Displays tokens, syntax tree, and translation phases.  
FeatureShowcase – Highlights supported C features and examples.  
PhaseIndicator – Shows the current stage of compilation.  
CCompiler – Core interface to input C code and view Java/Python output.  

# Features

Real-time C-to-Java/Python code translation  
Clear visualization of lexical and syntax analysis  
Supports basic C constructs: loops, conditionals, functions, expressions  
Educational tool for understanding compiler design and language mapping  

# Command to run file -:  
npm run dev  

