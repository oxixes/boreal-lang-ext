import { Lexer } from './lexer';
import { Parser } from './parser';
import { SymbolTable } from './symbolTable';
import { ASTNode } from '../types/ast';
import { LexicalError } from '../types/token';
import { SemanticError } from '../types/symbol';
import { SyntaxError } from '../types/ast';

/**
 * Integrated Analyzer that coordinates Lexer, Parser, and Semantic Analyzer
 *
 * This class implements the architecture from the Java code where:
 * - Lexer validates identifiers against the symbol table during tokenization
 * - Parser calls getNextToken() incrementally (not all at once)
 * - Semantic Analyzer maintains declaration zone state
 *
 * The integration allows proper handling of:
 * - Identifier declarations in declaration zones
 * - Identifier usage validation outside declaration zones
 * - Scope management during parsing
 */
export class IntegratedAnalyzer {
  private lexer: Lexer;
  private parser: Parser;
  private symbolTable: SymbolTable;

  constructor(input: string) {
    // Create symbol table
    this.symbolTable = new SymbolTable();

    // Create lexer with symbol table reference
    this.lexer = new Lexer(input, this.symbolTable);

    // Create parser with lexer and symbol table reference
    this.parser = new Parser(this.lexer, this.symbolTable);
  }

  /**
   * Perform full analysis: lexical, syntactic, and semantic
   */
  public analyze(): {
    ast: ASTNode | null;
    lexicalErrors: LexicalError[];
    syntaxErrors: SyntaxError[];
    semanticErrors: SemanticError[];
    semanticWarnings: SemanticError[];
    symbolTable: SymbolTable;
  } {
    // Set lexer to work with symbol table
    this.lexer.setSymbolTable(this.symbolTable);

    // Parse - this will call lexer incrementally
    // Semantic actions execute during parsing to perform type checking
    const ast = this.parser.parse();

    // Get lexical errors
    const lexicalErrors = this.lexer.errors;

    // Get syntax errors
    const syntaxErrors = this.parser.errors;

    // Get semantic errors and warnings from semantic actions
    // (executed during parsing, not in a separate post-parse phase)
    const semanticActions = this.parser.getSemanticActions();
    const semanticErrors = semanticActions.errors;
    const semanticWarnings = semanticActions.warnings;

    return {
      ast,
      lexicalErrors,
      syntaxErrors,
      semanticErrors,
      semanticWarnings,
      symbolTable: this.symbolTable
    };
  }
}

/**
 * Helper function to create and run a complete analysis
 */
export function analyzeBoreal(input: string) {
  const analyzer = new IntegratedAnalyzer(input);
  return analyzer.analyze();
}
