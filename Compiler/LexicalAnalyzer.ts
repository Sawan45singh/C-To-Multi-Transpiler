export const TokenType = {
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  STRING: "STRING",
  OPERATOR: "OPERATOR",
  DELIMITER: "DELIMITER",
  NEWLINE: "NEWLINE",
  EOF: "EOF",
} as const;

export type Token = {
  type: keyof typeof TokenType;
  value: string | null;
  line?: number;
  column?: number;
};

export class LexicalAnalyzer {
  private code: string;
  private position: number;
  private line: number;
  private column: number;
  private tokens: Token[];
  private keywords: Set<string>;

  constructor(code: string) {
    this.code = code;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.keywords = new Set([
      "int", "float", "double", "char", "void", "if", "else", "while", "for", 
      "return", "include", "main", "printf", "scanf", "bool", "long", "short",
      "break", "continue", "switch", "case", "default", "const", "static",
      "struct", "union", "enum", "typedef", "extern", "register", "auto",
      "volatile", "signed", "unsigned", "goto", "do", "sizeof"
    ]);
  }

  tokenize(): Token[] {
    while (this.position < this.code.length) {
      this.skipWhitespace();
      if (this.position >= this.code.length) break;

      const char = this.code[this.position];

      if (char === '/' && this.peek() === '/') {
        this.skipSingleLineComment();
      } else if (char === '/' && this.peek() === '*') {
        this.skipMultiLineComment();
      } else if (this.isLetter(char) || char === "_") {
        this.readIdentifier();
      } else if (this.isDigit(char)) {
        this.readNumber();
      } else if (char === '"') {
        this.readString();
      } else if (char === "'") {
        this.readCharLiteral();
      } else if (this.isOperator(char)) {
        this.readOperator();
      } else if (this.isDelimiter(char)) {
        this.readDelimiter();
      } else if (char === "\n") {
        this.tokens.push({ 
          type: "NEWLINE", 
          value: "\n", 
          line: this.line, 
          column: this.column 
        });
        this.advance();
      } else {
        this.advance();
      }
    }
    this.tokens.push({ type: "EOF", value: null });
    return this.tokens;
  }

  private advance(): void {
    if (this.code[this.position] === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  private peek(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.code.length ? this.code[pos] : null;
  }

  private skipSingleLineComment(): void {
    while (this.position < this.code.length && this.code[this.position] !== '\n') {
      this.advance();
    }
  }

  private skipMultiLineComment(): void {
    this.advance(); // Skip /
    this.advance(); // Skip *
    while (this.position < this.code.length - 1) {
      if (this.code[this.position] === '*' && this.code[this.position + 1] === '/') {
        this.advance(); // Skip *
        this.advance(); // Skip /
        break;
      }
      this.advance();
    }
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isOperator(char: string): boolean {
    return "+-*/%=<>!&|^~".includes(char);
  }

  private isDelimiter(char: string): boolean {
    return "(){}[];,#.".includes(char);
  }

  private skipWhitespace(): void {
    while (
      this.position < this.code.length &&
      /\s/.test(this.code[this.position]) &&
      this.code[this.position] !== "\n"
    ) {
      this.advance();
    }
  }

  private readIdentifier(): void {
    let value = "";
    const startLine = this.line;
    const startColumn = this.column;
    
    while (
      this.position < this.code.length &&
      (this.isLetter(this.code[this.position]) ||
        this.isDigit(this.code[this.position]) ||
        this.code[this.position] === "_")
    ) {
      value += this.code[this.position];
      this.advance();
    }

    const type = this.keywords.has(value) ? "KEYWORD" : "IDENTIFIER";
    this.tokens.push({ 
      type, 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }

  private readNumber(): void {
    let value = "";
    let hasDecimal = false;
    const startLine = this.line;
    const startColumn = this.column;

    while (
      this.position < this.code.length &&
      (this.isDigit(this.code[this.position]) ||
        (this.code[this.position] === "." && !hasDecimal))
    ) {
      if (this.code[this.position] === ".") hasDecimal = true;
      value += this.code[this.position];
      this.advance();
    }

    this.tokens.push({ 
      type: "NUMBER", 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }

  private readString(): void {
    let value = "";
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // Skip opening quote

    while (this.position < this.code.length && this.code[this.position] !== '"') {
      if (this.code[this.position] === '\\' && this.position + 1 < this.code.length) {
        value += this.code[this.position];
        this.advance();
        if (this.position < this.code.length) {
          value += this.code[this.position];
          this.advance();
        }
      } else {
        value += this.code[this.position];
        this.advance();
      }
    }

    if (this.position < this.code.length) this.advance(); // Skip closing quote
    this.tokens.push({ 
      type: "STRING", 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }

  private readCharLiteral(): void {
    let value = "";
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // Skip opening quote

    while (this.position < this.code.length && this.code[this.position] !== "'") {
      if (this.code[this.position] === '\\' && this.position + 1 < this.code.length) {
        value += this.code[this.position];
        this.advance();
        if (this.position < this.code.length) {
          value += this.code[this.position];
          this.advance();
        }
      } else {
        value += this.code[this.position];
        this.advance();
      }
    }

    if (this.position < this.code.length) this.advance(); // Skip closing quote
    this.tokens.push({ 
      type: "STRING", 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }

  private readOperator(): void {
    let value = this.code[this.position];
    const startLine = this.line;
    const startColumn = this.column;
    this.advance();

    // Check for multi-character operators
    if (this.position < this.code.length) {
      const next = this.code[this.position];
      const twoChar = value + next;
      
      if (["==", "!=", "<=", ">=", "++", "--", "&&", "||", "+=", "-=", "*=", "/=", "%=", "<<", ">>"].includes(twoChar)) {
        value = twoChar;
        this.advance();
      }
    }

    this.tokens.push({ 
      type: "OPERATOR", 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }

  private readDelimiter(): void {
    const value = this.code[this.position];
    const startLine = this.line;
    const startColumn = this.column;
    this.advance();
    this.tokens.push({ 
      type: "DELIMITER", 
      value, 
      line: startLine, 
      column: startColumn 
    });
  }
}