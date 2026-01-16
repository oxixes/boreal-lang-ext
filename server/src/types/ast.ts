import { Token } from './token';

/**
 * AST Node types for the Boreal language
 */
export enum ASTNodeType {
  PROGRAM = 'PROGRAM',
  BLOCK = 'BLOCK',
  VAR_DECLARATION = 'VAR_DECLARATION',
  PROCEDURE_DECLARATION = 'PROCEDURE_DECLARATION',
  FUNCTION_DECLARATION = 'FUNCTION_DECLARATION',
  PARAMETER = 'PARAMETER',
  ASSIGNMENT = 'ASSIGNMENT',
  IF_STATEMENT = 'IF_STATEMENT',
  WHILE_STATEMENT = 'WHILE_STATEMENT',
  FOR_STATEMENT = 'FOR_STATEMENT',
  REPEAT_STATEMENT = 'REPEAT_STATEMENT',
  CASE_STATEMENT = 'CASE_STATEMENT',
  PROCEDURE_CALL = 'PROCEDURE_CALL',
  FUNCTION_CALL = 'FUNCTION_CALL',
  BINARY_EXPRESSION = 'BINARY_EXPRESSION',
  UNARY_EXPRESSION = 'UNARY_EXPRESSION',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL'
}

/**
 * Base AST Node
 */
export interface ASTNode {
  type: ASTNodeType;
  token?: Token;
  children?: ASTNode[];
}

/**
 * Program node (root)
 */
export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  name: string;
  declarations: ASTNode[];
  body: ASTNode;
}

/**
 * Variable declaration node
 */
export interface VarDeclarationNode extends ASTNode {
  type: ASTNodeType.VAR_DECLARATION;
  identifiers: string[];
  dataType: string;
}

/**
 * Syntax error information
 */
export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  position: number;
  expected?: string[];
  found?: string;
  length?: number;
}
