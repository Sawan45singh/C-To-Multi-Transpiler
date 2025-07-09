export interface ASTNode {
  type: string;
  body?: any[];
  [key: string]: any;
}

export class SyntaxAnalyzer {
  private tokens: any[];
  private position: number;
  private ast: ASTNode;

  constructor(tokens: any[]) {
    this.tokens = tokens.filter(token => token.type !== "NEWLINE"); // Filter out newlines for easier parsing
    this.position = 0;
    this.ast = { type: "Program", body: [] };
  }

  parse(): ASTNode {
    while (this.position < this.tokens.length && this.tokens[this.position].type !== "EOF") {
      const node = this.parseStatement();
      if (node) this.ast.body!.push(node);
    }
    return this.ast;
  }

  private parseStatement(): any {
    const token = this.getCurrentToken();
    if (!token) return null;

    // Skip newlines
    if (token.type === "NEWLINE") {
      this.position++;
      return null;
    }

    // Handle preprocessor directives
    if (token.type === "DELIMITER" && token.value === "#") {
      return this.parseInclude();
    }

    // Handle keywords
    if (token.type === "KEYWORD") {
      switch (token.value) {
        case "if":
          return this.parseIfStatement();
        case "while":
          return this.parseWhileStatement();
        case "for":
          return this.parseForStatement();
        case "return":
          return this.parseReturnStatement();
        case "printf":
          return this.parsePrintfStatement();
        case "scanf":
          return this.parseScanfStatement();
        case "int":
        case "float":
        case "double":
        case "char":
        case "void":
        case "long":
        case "short":
          return this.parseDeclarationOrFunction();
        default:
          this.position++;
          return null;
      }
    }

    // Handle identifiers (assignments or function calls)
    if (token.type === "IDENTIFIER") {
      return this.parseAssignmentOrFunctionCall();
    }

    // Handle blocks
    if (token.type === "DELIMITER" && token.value === "{") {
      return this.parseBlock();
    }

    this.position++;
    return null;
  }

  private parseInclude(): any {
    this.position++; // Skip #
    const includeToken = this.getCurrentToken();
    if (includeToken && includeToken.value === "include") {
      this.position++;
      const delimiter = this.getCurrentToken();
      if (delimiter && (delimiter.value === "<" || delimiter.value === '"')) {
        this.position++;
        const library = this.getCurrentToken();
        if (library) {
          this.position++;
          this.position++; // Skip closing delimiter
          return {
            type: "Include",
            library: library.value,
          };
        }
      }
    }
    return null;
  }

  private parseDeclarationOrFunction(): any {
    const typeToken = this.getCurrentToken();
    if (!typeToken) return null;
    
    this.position++;
    const nameToken = this.getCurrentToken();

    if (nameToken && nameToken.type === "IDENTIFIER") {
      this.position++;
      const nextToken = this.getCurrentToken();

      if (nextToken && nextToken.value === "(") {
        // It's a function
        return this.parseFunction(typeToken.value, nameToken.value);
      } else {
        // It's a variable declaration
        return this.parseVariable(typeToken.value, nameToken.value);
      }
    }
    return null;
  }

  private parseFunction(returnType: string, name: string): any {
    this.position++; // Skip (
    const params: any[] = [];

    // Parse parameters
    while (this.position < this.tokens.length) {
      const token = this.getCurrentToken();
      if (!token) break;
      
      if (token.value === ")") {
        this.position++;
        break;
      }
      
      if (token.value === ",") {
        this.position++;
        continue;
      }
      
      if (token.type === "KEYWORD" && ["int", "float", "double", "char", "void", "long", "short"].includes(token.value)) {
        const paramType = token.value;
        this.position++;
        const paramName = this.getCurrentToken();
        if (paramName && paramName.type === "IDENTIFIER") {
          params.push({ type: paramType, name: paramName.value });
          this.position++;
        }
      } else {
        this.position++;
      }
    }

    // Parse function body
    let body: any[] = [];
    const openBrace = this.getCurrentToken();
    if (openBrace && openBrace.value === "{") {
      const blockNode = this.parseBlock();
      body = blockNode ? blockNode.body : [];
    }

    return {
      type: "Function",
      returnType,
      name,
      parameters: params,
      body: body,
    };
  }

  private parseBlock(): any {
    this.position++; // Skip {
    const statements: any[] = [];
    
    while (this.position < this.tokens.length) {
      const token = this.getCurrentToken();
      if (!token) break;
      
      if (token.value === "}") {
        this.position++;
        break;
      }
      
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }

    return {
      type: "Block",
      body: statements
    };
  }

  private parseVariable(varType: string, name: string): any {
    const node = {
      type: "Variable",
      dataType: varType,
      name,
      value: null as any,
    };

    const nextToken = this.getCurrentToken();
    if (nextToken && nextToken.value === "=") {
      this.position++;
      node.value = this.parseExpression();
    }

    // Skip semicolon if present
    this.skipToken(";");
    return node;
  }

  private parseIfStatement(): any {
    this.position++; // Skip 'if'
    
    // Skip opening parenthesis
    this.skipToken("(");
    
    const condition = this.parseExpression();
    
    // Skip closing parenthesis
    this.skipToken(")");
    
    const thenStatement = this.parseStatement();
    let elseStatement = null;

    // Check for else clause
    const elseToken = this.getCurrentToken();
    if (elseToken && elseToken.value === "else") {
      this.position++;
      elseStatement = this.parseStatement();
    }

    return {
      type: "IfStatement",
      condition,
      then: thenStatement,
      else: elseStatement
    };
  }

  private parseWhileStatement(): any {
    this.position++; // Skip 'while'
    
    this.skipToken("(");
    const condition = this.parseExpression();
    this.skipToken(")");
    
    const body = this.parseStatement();

    return {
      type: "WhileLoop",
      condition,
      body
    };
  }

  private parseForStatement(): any {
    this.position++; // Skip 'for'
    
    this.skipToken("(");
    
    // Parse initialization
    let init = null;
    const initToken = this.getCurrentToken();
    if (initToken && initToken.type === "KEYWORD") {
      init = this.parseDeclarationOrFunction();
    } else if (initToken && initToken.type === "IDENTIFIER") {
      init = this.parseAssignmentOrFunctionCall();
    }
    
    this.skipToken(";");
    
    // Parse condition
    const condition = this.parseExpression();
    this.skipToken(";");
    
    // Parse update
    const update = this.parseExpression();
    this.skipToken(")");
    
    // Parse body
    const body = this.parseStatement();

    return {
      type: "ForLoop",
      init,
      condition,
      update,
      body
    };
  }

  private parseReturnStatement(): any {
    this.position++; // Skip 'return'
    
    let value = null;
    const nextToken = this.getCurrentToken();
    if (nextToken && nextToken.value !== ";") {
      value = this.parseExpression();
    }

    this.skipToken(";");
    
    return {
      type: "ReturnStatement",
      value
    };
  }

  private parsePrintfStatement(): any {
    this.position++; // Skip 'printf'
    
    this.skipToken("(");
    
    const args: any[] = [];
    while (this.position < this.tokens.length) {
      const token = this.getCurrentToken();
      if (!token || token.value === ")") {
        if (token && token.value === ")") this.position++;
        break;
      }
      
      if (token.value === ",") {
        this.position++;
        continue;
      }
      
      const expr = this.parseExpression();
      if (expr) args.push(expr);
    }

    this.skipToken(";");
    
    return {
      type: "PrintfStatement",
      arguments: args
    };
  }

  private parseScanfStatement(): any {
    this.position++; // Skip 'scanf'
    
    this.skipToken("(");
    
    const args: any[] = [];
    while (this.position < this.tokens.length) {
      const token = this.getCurrentToken();
      if (!token || token.value === ")") {
        if (token && token.value === ")") this.position++;
        break;
      }
      
      if (token.value === ",") {
        this.position++;
        continue;
      }
      
      const expr = this.parseExpression();
      if (expr) args.push(expr);
    }

    this.skipToken(";");
    
    return {
      type: "ScanfStatement",
      arguments: args
    };
  }

  private parseAssignmentOrFunctionCall(): any {
    const identifier = this.getCurrentToken();
    if (!identifier) return null;
    
    this.position++;
    const next = this.getCurrentToken();
    
    if (next && next.value === "(") {
      // Function call
      this.position++;
      const args: any[] = [];
      
      while (this.position < this.tokens.length) {
        const token = this.getCurrentToken();
        if (!token || token.value === ")") {
          if (token && token.value === ")") this.position++;
          break;
        }
        
        if (token.value === ",") {
          this.position++;
          continue;
        }
        
        const expr = this.parseExpression();
        if (expr) args.push(expr);
      }

      this.skipToken(";");
      
      return {
        type: "FunctionCall",
        name: identifier.value,
        arguments: args
      };
    } else if (next && ["=", "+=", "-=", "*=", "/=", "++", "--"].includes(next.value)) {
      // Assignment
      if (next.value === "++" || next.value === "--") {
        this.position++;
        this.skipToken(";");
        return {
          type: "Assignment",
          identifier: identifier.value,
          operator: next.value,
          value: null
        };
      } else {
        this.position++;
        const value = this.parseExpression();
        this.skipToken(";");
        
        return {
          type: "Assignment",
          identifier: identifier.value,
          operator: next.value,
          value
        };
      }
    }

    // If neither function call nor assignment, treat as expression
    this.position--;
    return this.parseExpression();
  }

  private parseExpression(): any {
    return this.parseOrExpression();
  }

  private parseOrExpression(): any {
    let left = this.parseAndExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || token.value !== "||") break;
      
      const operator = token.value;
      this.position++;
      const right = this.parseAndExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parseAndExpression(): any {
    let left = this.parseEqualityExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || token.value !== "&&") break;
      
      const operator = token.value;
      this.position++;
      const right = this.parseEqualityExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parseEqualityExpression(): any {
    let left = this.parseRelationalExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || !["==", "!="].includes(token.value)) break;
      
      const operator = token.value;
      this.position++;
      const right = this.parseRelationalExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parseRelationalExpression(): any {
    let left = this.parseAdditiveExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || !["<", ">", "<=", ">="].includes(token.value)) break;
      
      const operator = token.value;
      this.position++;
      const right = this.parseAdditiveExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parseAdditiveExpression(): any {
    let left = this.parseMultiplicativeExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || !["+", "-"].includes(token.value)) break;
      
      const operator = token.value;
      this.position++;
      const right = this.parseMultiplicativeExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parseMultiplicativeExpression(): any {
    let left = this.parsePrimaryExpression();
    
    while (true) {
      const token = this.getCurrentToken();
      if (!token || !["*", "/", "%"].includes(token.value)) break;
      
      const operator = token.value;
      this.position++;
      const right = this.parsePrimaryExpression();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      };
    }
    
    return left;
  }

  private parsePrimaryExpression(): any {
    const token = this.getCurrentToken();
    if (!token) return null;

    if (token.type === "NUMBER") {
      this.position++;
      const value = parseFloat(token.value);
      return { 
        type: "Literal", 
        value: value, 
        dataType: token.value.includes('.') ? "float" : "int" 
      };
    } else if (token.type === "STRING") {
      this.position++;
      return { type: "Literal", value: token.value, dataType: "string" };
    } else if (token.type === "IDENTIFIER") {
      const identifier = token.value;
      this.position++;
      
      const nextToken = this.getCurrentToken();
      if (nextToken && nextToken.value === "(") {
        // Function call
        this.position--;
        return this.parseAssignmentOrFunctionCall();
      }
      
      return { type: "Identifier", name: identifier };
    } else if (token.value === "(") {
      this.position++; // Skip (
      const expr = this.parseExpression();
      this.skipToken(")"); // Skip )
      return expr;
    } else if (token.value === "&") {
      // Address operator
      this.position++;
      const expr = this.parsePrimaryExpression();
      return {
        type: "UnaryExpression",
        operator: "&",
        operand: expr
      };
    }

    this.position++;
    return null;
  }

  private skipToken(expectedValue: string): void {
    const token = this.getCurrentToken();
    if (token && token.value === expectedValue) {
      this.position++;
    }
  }

  private getCurrentToken(): any {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }
}