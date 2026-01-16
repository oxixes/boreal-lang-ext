import { Symbol as BorealSymbol } from './symbol';

/**
 * Token types for the Boreal language lexical analyzer
 * Based on the DFA (Deterministic Finite Automaton)
 */
export enum TokenType {
  // Keywords
  PROGRAM = 'PROGRAM',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
  WRITE = 'WRITE',
  WRITELN = 'WRITELN',
  READ = 'READ',
  FUNCTION = 'FUNCTION',
  PROCEDURE = 'PROCEDURE',
  RETURN = 'RETURN',
  BEGIN = 'BEGIN',
  END = 'END',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  DO = 'DO',
  WHILE = 'WHILE',
  REPEAT = 'REPEAT',
  UNTIL = 'UNTIL',
  LOOP = 'LOOP',
  FOR = 'FOR',
  CASE = 'CASE',
  OF = 'OF',
  OTHERWISE = 'OTHERWISE',
  VAR = 'VAR',
  WHEN = 'WHEN',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  EXIT = 'EXIT',

  // Data types and literals
  IDENTIFIER = 'IDENTIFIER',
  INTEGER_LITERAL = 'INTEGER_LITERAL',
  STRING_LITERAL = 'STRING_LITERAL',

  // Operators
  PLUS = 'PLUS',              // +
  MINUS = 'MINUS',            // -
  MULTIPLY = 'MULTIPLY',      // *
  DIVIDE = 'DIVIDE',          // /
  POWER = 'POWER',            // ^
  MOD = 'MOD',                // mod
  AND = 'AND',                // and
  OR = 'OR',                  // or
  XOR = 'XOR',                // xor
  NOT = 'NOT',                // not
  IN = 'IN',                  // in
  MAX = 'MAX',                // max
  MIN = 'MIN',                // min
  TO = 'TO',                  // to

  // Comparison operators
  EQUAL = 'EQUAL',            // =
  NOT_EQUAL = 'NOT_EQUAL',    // <>
  LESS_THAN = 'LESS_THAN',    // <
  LESS_EQUAL = 'LESS_EQUAL',  // <=
  GREATER_THAN = 'GREATER_THAN', // >
  GREATER_EQUAL = 'GREATER_EQUAL', // >=

  // Delimiters
  LPAREN = 'LPAREN',          // (
  RPAREN = 'RPAREN',          // )
  SEMICOLON = 'SEMICOLON',    // ;
  COLON = 'COLON',            // :
  COMMA = 'COMMA',            // ,
  ASSIGN = 'ASSIGN',          // :=

  // Special
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF',
  ERROR = 'ERROR'
}

/**
 * Token interface representing a lexical unit
 */
export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
  position: number;
  symbol?: BorealSymbol;  // Reference to symbol table entry (for identifiers)
}

/**
 * Lexical error information
 */
export interface LexicalError {
  message: string;
  line: number;
  column: number;
  position: number;
  length: number;
}
