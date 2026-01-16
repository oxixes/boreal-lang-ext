/**
 * Symbol kinds in the symbol table
 */
export enum SymbolKind {
  UNKNOWN = 'UNKNOWN',
  VARIABLE = 'VARIABLE',
  PARAMETER = 'PARAMETER',
  FUNCTION = 'FUNCTION',
  PROCEDURE = 'PROCEDURE',
  PROGRAM = 'PROGRAM'
}

/**
 * Data types in Boreal
 */
export enum DataType {
  INTEGER = 'INTEGER',
  REAL = 'REAL',
  BOOLEAN = 'BOOLEAN',
  CHAR = 'CHAR',
  STRING = 'STRING',
  VOID = 'VOID'
}

/**
 * Symbol entry in the symbol table
 */
export interface Symbol {
  name: string;
  kind: SymbolKind;
  dataType?: DataType;
  scope: string;

  offset?: number; // Memory offset

  // For functions and procedures
  parameters?: Parameter[];
  returnType?: DataType;

  byReference?: boolean; // For parameters

  label?: string; // For code generation (procedure/function labels)

  // Position information for go-to-definition
  position?: number; // Absolute position in source
  line?: number; // Line number (1-based)
  column?: number; // Column number (0-based)
  length?: number; // Length of the symbol name
}

/**
 * Parameter information for functions/procedures
 */
export interface Parameter {
  name: string;
  dataType: DataType;
  byReference: boolean;
}

/**
 * Semantic error information
 */
export interface SemanticError {
  message: string;
  line: number;
  column: number;
  length: number;
  position: number;
  severity: 'error' | 'warning';
}

/**
 * Semantic token for highlighting
 */
export interface SemanticToken {
  line: number; // 0-based
  column: number; // 0-based
  length: number;
  tokenType: 'variable' | 'function';
  tokenModifiers: string[]; // e.g., ['definition']
}

/**
 * Scope information for nested scopes
 */
export interface Scope {
  name: string;
  parent?: Scope;
  symbols: Map<string, Symbol>;
  children: Scope[];
}
