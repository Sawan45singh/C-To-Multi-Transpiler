
export type ASTNode = {
  type: string;
  [key: string]: any;
};

export class CodeGenerator {
  private ast: ASTNode;

  constructor(ast: ASTNode) {
    this.ast = ast;
  }

  generateJava(): string {
    let javaCode = "";
    let hasMain = false;
    const imports = new Set(["import java.util.Scanner;"]);
    let classContent = "";

    if (!this.ast.body || !Array.isArray(this.ast.body)) {
      return "// Error: Invalid AST structure";
    }

    for (const node of this.ast.body) {
      if (node.type === "Include") {
        // Handle includes if needed
        continue;
      } else if (node.type === "Function") {
        if (node.name === "main") {
          hasMain = true;
          classContent += `    public static void main(String[] args) {\n`;
          classContent += `        Scanner scanner = new Scanner(System.in);\n`;
          classContent += this.generateJavaStatements(node.body, "        ");
          classContent += `        scanner.close();\n`;
          classContent += `    }\n\n`;
        } else {
          const returnType = this.mapJavaType(node.returnType);
          const params = (node.parameters || [])
            .map((p: any) => `${this.mapJavaType(p.type)} ${p.name}`)
            .join(", ");
          classContent += `    public static ${returnType} ${node.name}(${params}) {\n`;
          classContent += this.generateJavaStatements(node.body, "        ");
          classContent += `    }\n\n`;
        }
      } else {
        classContent += this.generateJavaStatement(node, "    ");
      }
    }

    if (hasMain) {
      let fullCode = Array.from(imports).join("\n") + "\n\n";
      fullCode += `public class Main {\n${classContent}}`;
      return fullCode;
    }

    return classContent;
  }

  private generateJavaStatements(statements: any[], indent: string): string {
    let code = "";
    if (Array.isArray(statements)) {
      for (const stmt of statements) {
        const stmtCode = this.generateJavaStatement(stmt, indent);
        if (stmtCode) code += stmtCode;
      }
    }
    return code;
  }

  private generateJavaStatement(node: any, indent: string): string {
    if (!node) return "";

    switch (node.type) {
      case "Variable":
        const javaType = this.mapJavaType(node.dataType);
        const value = node.value ? this.generateJavaExpression(node.value) : this.getDefaultValue(javaType);
        return `${indent}${javaType} ${node.name} = ${value};\n`;

      case "Assignment":
        if (node.operator === "++" || node.operator === "--") {
          return `${indent}${node.identifier}${node.operator};\n`;
        }
        const assignValue = this.generateJavaExpression(node.value);
        return `${indent}${node.identifier} ${node.operator} ${assignValue};\n`;

      case "PrintfStatement":
        return this.generateJavaPrintf(node, indent);

      case "ScanfStatement":
        return this.generateJavaScanf(node, indent);

      case "FunctionCall":
        const callArgs = (node.arguments || []).map((arg: any) => this.generateJavaExpression(arg)).join(", ");
        return `${indent}${node.name}(${callArgs});\n`;

      case "IfStatement":
        return this.generateJavaIfStatement(node, indent);

      case "WhileLoop":
        let whileCode = `${indent}while (${this.generateJavaExpression(node.condition)}) {\n`;
        if (node.body && node.body.type === "Block") {
          whileCode += this.generateJavaStatements(node.body.body, indent + "    ");
        } else if (node.body) {
          whileCode += this.generateJavaStatement(node.body, indent + "    ");
        }
        whileCode += `${indent}}\n`;
        return whileCode;

      case "ForLoop":
        return this.generateJavaForLoop(node, indent);

      case "ReturnStatement":
        const retValue = node.value ? this.generateJavaExpression(node.value) : "";
        return `${indent}return ${retValue};\n`;

      case "Block":
        return this.generateJavaStatements(node.body, indent);

      default:
        return "";
    }
  }

  private generateJavaIfStatement(node: any, indent: string): string {
    let ifCode = `${indent}if (${this.generateJavaExpression(node.condition)}) {\n`;
    
    if (node.then && node.then.type === "Block") {
      ifCode += this.generateJavaStatements(node.then.body, indent + "    ");
    } else if (node.then) {
      ifCode += this.generateJavaStatement(node.then, indent + "    ");
    }
    
    ifCode += `${indent}}`;
    
    if (node.else) {
      ifCode += ` else {\n`;
      if (node.else.type === "Block") {
        ifCode += this.generateJavaStatements(node.else.body, indent + "    ");
      } else if (node.else.type === "IfStatement") {
        // Handle else if
        ifCode += `${indent}    ` + this.generateJavaIfStatement(node.else, "").trim() + "\n";
      } else {
        ifCode += this.generateJavaStatement(node.else, indent + "    ");
      }
      ifCode += `${indent}}`;
    }
    
    return ifCode + "\n";
  }

  private generateJavaForLoop(node: any, indent: string): string {
    const initCode = node.init ? this.generateJavaStatement(node.init, "").replace(/;\s*$/, "").trim() : "";
    const condCode = node.condition ? this.generateJavaExpression(node.condition) : "";
    const updateCode = node.update ? this.generateJavaExpression(node.update) : "";
    
    let forCode = `${indent}for (${initCode}; ${condCode}; ${updateCode}) {\n`;
    
    if (node.body && node.body.type === "Block") {
      forCode += this.generateJavaStatements(node.body.body, indent + "    ");
    } else if (node.body) {
      forCode += this.generateJavaStatement(node.body, indent + "    ");
    }
    
    forCode += `${indent}}\n`;
    return forCode;
  }

  private generateJavaPrintf(node: any, indent: string): string {
    if (!node.arguments || node.arguments.length === 0) {
      return `${indent}System.out.println();\n`;
    }
    
    const formatStr = this.generateJavaExpression(node.arguments[0]);
    const args = node.arguments.slice(1).map((arg: any) => this.generateJavaExpression(arg));
    
    if (args.length > 0) {
      return `${indent}System.out.printf(${formatStr}, ${args.join(", ")});\n`;
    } else {
      // Convert format string for simple print
      const cleanFormat = formatStr.replace(/"/g, '').replace(/\\n/g, '');
      if (cleanFormat.includes('%')) {
        return `${indent}System.out.printf(${formatStr});\n`;
      } else {
        return `${indent}System.out.println(${formatStr});\n`;
      }
    }
  }

  private generateJavaScanf(node: any, indent: string): string {
    if (!node.arguments || node.arguments.length < 2) {
      return `${indent}// Scanner input needed\n`;
    }
    
    const variable = this.generateJavaExpression(node.arguments[1]);
    const formatStr = node.arguments[0];
    
    // Determine input type based on format string
    if (formatStr && formatStr.value) {
      if (formatStr.value.includes('%d')) {
        return `${indent}${variable} = scanner.nextInt();\n`;
      } else if (formatStr.value.includes('%f')) {
        return `${indent}${variable} = scanner.nextFloat();\n`;
      } else if (formatStr.value.includes('%s')) {
        return `${indent}${variable} = scanner.next();\n`;
      }
    }
    
    return `${indent}${variable} = scanner.nextInt();\n`;
  }

  private generateJavaExpression(expr: any): string {
    if (!expr) return "";

    switch (expr.type) {
      case "Literal":
        if (expr.dataType === "string") {
          return `"${expr.value}"`;
        }
        return String(expr.value);
      case "Identifier":
        return expr.name;
      case "BinaryExpression":
        const left = this.generateJavaExpression(expr.left);
        const right = this.generateJavaExpression(expr.right);
        return `${left} ${expr.operator} ${right}`;
      case "UnaryExpression":
        const operand = this.generateJavaExpression(expr.operand);
        if (expr.operator === "&") {
          // Address operator - not directly supported in Java, return operand
          return operand;
        }
        return `${expr.operator}${operand}`;
      case "FunctionCall":
        const args = (expr.arguments || []).map((arg: any) => this.generateJavaExpression(arg)).join(", ");
        return `${expr.name}(${args})`;
      default:
        return "";
    }
  }

  generatePython(): string {
    let pythonCode = "";
    let hasMain = false;

    if (!this.ast.body || !Array.isArray(this.ast.body)) {
      return "# Error: Invalid AST structure";
    }

    for (const node of this.ast.body) {
      if (node.type === "Include") {
        continue;
      } else if (node.type === "Function") {
        if (node.name === "main") {
          hasMain = true;
          pythonCode += `def main():\n`;
          pythonCode += this.generatePythonStatements(node.body, "    ");
          pythonCode += `\n`;
        } else {
          const params = (node.parameters || []).map((p: any) => p.name).join(", ");
          pythonCode += `def ${node.name}(${params}):\n`;
          pythonCode += this.generatePythonStatements(node.body, "    ");
          pythonCode += `\n`;
        }
      } else {
        pythonCode += this.generatePythonStatement(node, "");
      }
    }

    if (hasMain) {
      pythonCode += `if __name__ == "__main__":\n    main()\n`;
    }

    return pythonCode;
  }

  private generatePythonStatements(statements: any[], indent: string): string {
    let code = "";
    let hasContent = false;
    
    if (Array.isArray(statements)) {
      for (const stmt of statements) {
        const stmtCode = this.generatePythonStatement(stmt, indent);
        if (stmtCode.trim()) {
          code += stmtCode;
          hasContent = true;
        }
      }
    }
    
    if (!hasContent) {
      code += `${indent}pass\n`;
    }
    
    return code;
  }

  private generatePythonStatement(node: any, indent: string): string {
    if (!node) return "";

    switch (node.type) {
      case "Variable":
        const value = node.value ? this.generatePythonExpression(node.value) : this.getPythonDefaultValue(node.dataType);
        return `${indent}${node.name} = ${value}\n`;

      case "Assignment":
        if (node.operator === "++") {
          return `${indent}${node.identifier} += 1\n`;
        } else if (node.operator === "--") {
          return `${indent}${node.identifier} -= 1\n`;
        }
        const assignValue = this.generatePythonExpression(node.value);
        const op = node.operator === "=" ? "=" : node.operator;
        return `${indent}${node.identifier} ${op} ${assignValue}\n`;

      case "PrintfStatement":
        return this.generatePythonPrintf(node, indent);

      case "ScanfStatement":
        return this.generatePythonScanf(node, indent);

      case "FunctionCall":
        const callArgs = (node.arguments || []).map((arg: any) => this.generatePythonExpression(arg)).join(", ");
        return `${indent}${node.name}(${callArgs})\n`;

      case "IfStatement":
        return this.generatePythonIfStatement(node, indent);

      case "WhileLoop":
        let whileCode = `${indent}while ${this.generatePythonExpression(node.condition)}:\n`;
        if (node.body && node.body.type === "Block") {
          whileCode += this.generatePythonStatements(node.body.body, indent + "    ");
        } else if (node.body) {
          whileCode += this.generatePythonStatement(node.body, indent + "    ");
        }
        return whileCode;

      case "ForLoop":
        return this.generatePythonForLoop(node, indent);

      case "ReturnStatement":
        const retValue = node.value ? this.generatePythonExpression(node.value) : "";
        return `${indent}return ${retValue}\n`;

      case "Block":
        return this.generatePythonStatements(node.body, indent);

      default:
        return "";
    }
  }

  private generatePythonIfStatement(node: any, indent: string): string {
    let ifCode = `${indent}if ${this.generatePythonExpression(node.condition)}:\n`;
    
    if (node.then && node.then.type === "Block") {
      ifCode += this.generatePythonStatements(node.then.body, indent + "    ");
    } else if (node.then) {
      ifCode += this.generatePythonStatement(node.then, indent + "    ");
    }
    
    if (node.else) {
      if (node.else.type === "IfStatement") {
        // Handle elif
        ifCode += `${indent}el` + this.generatePythonIfStatement(node.else, "").trim() + "\n";
      } else {
        ifCode += `${indent}else:\n`;
        if (node.else.type === "Block") {
          ifCode += this.generatePythonStatements(node.else.body, indent + "    ");
        } else {
          ifCode += this.generatePythonStatement(node.else, indent + "    ");
        }
      }
    }
    
    return ifCode;
  }

  private generatePythonForLoop(node: any, indent: string): string {
    if (node.init && node.condition && node.update) {
      // Extract loop variable and range
      const initVar = node.init.name || node.init.identifier;
      const startVal = node.init.value ? this.generatePythonExpression(node.init.value) : "0";
      
      let endVal = "10";
      if (node.condition.type === "BinaryExpression") {
        if (node.condition.operator === "<") {
          endVal = this.generatePythonExpression(node.condition.right);
        } else if (node.condition.operator === "<=") {
          endVal = `${this.generatePythonExpression(node.condition.right)} + 1`;
        }
      }
      
      let forCode = `${indent}for ${initVar} in range(${startVal}, ${endVal}):\n`;
      if (node.body && node.body.type === "Block") {
        forCode += this.generatePythonStatements(node.body.body, indent + "    ");
      } else if (node.body) {
        forCode += this.generatePythonStatement(node.body, indent + "    ");
      }
      return forCode;
    }
    return `${indent}# For loop conversion needed\n`;
  }

  private generatePythonPrintf(node: any, indent: string): string {
    if (!node.arguments || node.arguments.length === 0) {
      return `${indent}print()\n`;
    }
    
    const formatStr = node.arguments[0];
    const args = node.arguments.slice(1);
    
    if (args.length > 0) {
      // Convert C format specifiers to Python f-string or format
      let pythonFormat = formatStr.value || formatStr;
      pythonFormat = pythonFormat.replace(/%d/g, '{}').replace(/%s/g, '{}').replace(/%f/g, '{}').replace(/%c/g, '{}');
      
      const argValues = args.map((arg: any) => this.generatePythonExpression(arg)).join(", ");
      return `${indent}print("${pythonFormat}".format(${argValues}))\n`;
    } else {
      const printValue = this.generatePythonExpression(formatStr);
      return `${indent}print(${printValue})\n`;
    }
  }

  private generatePythonScanf(node: any, indent: string): string {
    if (!node.arguments || node.arguments.length < 2) {
      return `${indent}# Input needed\n`;
    }
    
    const variable = this.generatePythonExpression(node.arguments[1]);
    const formatStr = node.arguments[0];
    
    if (formatStr && formatStr.value) {
      if (formatStr.value.includes('%d')) {
        return `${indent}${variable} = int(input())\n`;
      } else if (formatStr.value.includes('%f')) {
        return `${indent}${variable} = float(input())\n`;
      } else if (formatStr.value.includes('%s')) {
        return `${indent}${variable} = input()\n`;
      }
    }
    
    return `${indent}${variable} = int(input())\n`;
  }

  private generatePythonExpression(expr: any): string {
    if (!expr) return "";

    switch (expr.type) {
      case "Literal":
        if (expr.dataType === "string") {
          return `"${expr.value}"`;
        }
        return String(expr.value);
      case "Identifier":
        return expr.name;
      case "BinaryExpression":
        const left = this.generatePythonExpression(expr.left);
        const right = this.generatePythonExpression(expr.right);
        let op = expr.operator;
        if (op === "&&") op = "and";
        else if (op === "||") op = "or";
        return `${left} ${op} ${right}`;
      case "UnaryExpression":
        const operand = this.generatePythonExpression(expr.operand);
        if (expr.operator === "&") {
          // Address operator - not needed in Python
          return operand;
        }
        return `${expr.operator}${operand}`;
      case "FunctionCall":
        const args = (expr.arguments || []).map((arg: any) => this.generatePythonExpression(arg)).join(", ");
        return `${expr.name}(${args})`;
      default:
        return "";
    }
  }

  private mapJavaType(cType: string): string {
    const typeMap: { [key: string]: string } = {
      int: "int",
      float: "float",
      double: "double",
      char: "char",
      void: "void",
      long: "long",
      short: "short",
      bool: "boolean"
    };
    return typeMap[cType] || "Object";
  }

  private getDefaultValue(javaType: string): string {
    const defaults: { [key: string]: string } = {
      int: "0",
      float: "0.0f",
      double: "0.0",
      char: "'\\0'",
      boolean: "false",
      long: "0L",
      short: "0"
    };
    return defaults[javaType] || "null";
  }

  private getPythonDefaultValue(cType: string): string {
    const defaults: { [key: string]: string } = {
      int: "0",
      float: "0.0",
      double: "0.0",
      char: "''",
      void: "None",
      long: "0",
      short: "0"
    };
    return defaults[cType] || "None";
  }
}