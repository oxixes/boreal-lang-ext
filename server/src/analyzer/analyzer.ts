import { Lexer } from './lexer';
import { Parser } from './parser';
import { SymbolTable } from './symbolTable';
import { ASTNode } from '../types/ast';
import { TokenType } from '../types/token';
import { LexicalError } from '../types/token';
import { SemanticError, SemanticToken } from '../types/symbol';
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
    semanticTokens: SemanticToken[];
    symbolTable: SymbolTable;
  } {
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

    // Get semantic tokens from lexer and semantic actions
    const semanticTokens = semanticActions.getSemanticTokens();

    return {
      ast,
      lexicalErrors,
      syntaxErrors,
      semanticErrors,
      semanticWarnings,
      semanticTokens,
      symbolTable: this.symbolTable
    };
  }

  /**
   * Find the definition location for a symbol at the given position
   *
   * @param position The cursor position
   * @returns Symbol information, or undefined if not found
   */
  public findSymbolDefinition(line: number, column: number): { position: number; line: number; column: number; length: number } | undefined {
    // Set lexer to stop at the given position
    this.lexer.setStopAt(line, column);

    // Parse - this will call lexer incrementally
    // Semantic actions execute during parsing to perform type checking
    const ast = this.parser.parse();

    // Check for lexical or syntax errors
    if (this.lexer.errors.length > 0 || this.parser.errors.length > 0) {
      return undefined;
    }

    // Get the last token processed by the lexer
    const lastToken = this.lexer.getLastToken();
    if (!lastToken || lastToken.type !== TokenType.IDENTIFIER) {
      return undefined;
    }

    // Lookup the symbol in the symbol table
    const symbol = this.symbolTable.lookup(lastToken.lexeme);
    if (!symbol) {
      return undefined;
    }

    // Return symbol position information
    if (symbol.position === undefined || symbol.line === undefined || symbol.column === undefined) {
      return undefined;
    }

    return {
      position: symbol.position,
      line: symbol.line,
      column: symbol.column,
      length: symbol.length || lastToken.lexeme.length
    };
  }
}
