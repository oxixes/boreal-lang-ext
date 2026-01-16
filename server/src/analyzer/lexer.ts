import { Token, TokenType, LexicalError } from '../types/token';
import { SymbolTable } from './symbolTable';
import { Symbol as BorealSymbol, SymbolKind } from '../types/symbol';

/**
 * Actions that can be performed by the lexer automaton
 */
enum Action {
  Read = 'Read',
  EOL = 'EOL',
  None = 'None',

  // Greater than actions
  A1_11 = 'A1_11', // >=
  A1_12 = 'A1_12', // >

  // String actions
  A0_2 = 'A0_2',   // Start string
  A2_2 = 'A2_2',   // Accumulate string char
  A2_21 = 'A2_21', // End string

  // Identifier actions
  A0_3 = 'A0_3',   // Start identifier
  A3_3 = 'A3_3',   // Accumulate identifier char
  A3_31 = 'A3_31', // End identifier

  // Number actions
  A0_4 = 'A0_4',   // Start number
  A4_4 = 'A4_4',   // Accumulate digit
  A4_41 = 'A4_41', // End number

  // Power actions
  A5_51 = 'A5_51', // ^
  A5_52 = 'A5_52', // *

  // Less than actions
  A7_71 = 'A7_71', // <
  A7_72 = 'A7_72', // <>
  A7_73 = 'A7_73', // <=

  // Colon actions
  A8_81 = 'A8_81', // :
  A8_82 = 'A8_82', // :=

  // Single character tokens
  A0_100 = 'A0_100', // +
  A0_101 = 'A0_101', // -
  A0_102 = 'A0_102', // /
  A0_103 = 'A0_103', // =
  A0_104 = 'A0_104', // (
  A0_105 = 'A0_105', // )
  A0_106 = 'A0_106', // ;
  A0_107 = 'A0_107', // ,
  A0_108 = 'A0_108', // EOF

  // Error actions
  ELEX0_ERROR_OC = 'ELEX0_ERROR_OC',
  ELEX0_ILLEGAL_COMMENT_CLOSE = 'ELEX0_ILLEGAL_COMMENT_CLOSE',
  ELEX2_ERROR_LINE_BREAK = 'ELEX2_ERROR_LINE_BREAK',
  ELEX2_ERROR_INCOMPLETE_STRING = 'ELEX2_ERROR_INCOMPLETE_STRING',
  ELEX6_ERROR_UNCLOSED_COMMENT = 'ELEX6_ERROR_UNCLOSED_COMMENT'
}

/**
 * Represents an entry in the transition matrix
 */
class TransitionEntry {
  constructor(
    public nextState: number,
    public action: Action
  ) {}
}

/**
 * Lexical Analyzer for Boreal Language
 * Implements a DFA (Deterministic Finite Automaton) based lexer with transition matrix
 */
export class Lexer {
  private input: string;
  private position: number;
  private line: number;
  private column: number;
  private currentCharCode: number;

  // Transition matrix [state][column] -> TransitionEntry
  private transitionMatrix: (TransitionEntry | null)[][] = [];

  // For each state, stores which columns should NOT be treated as "other character"
  private ocExclude: Map<number, Set<number>> = new Map();

  // Keywords map for quick lookup
  private readonly keywords: Map<string, TokenType> = new Map([
    ['program', TokenType.PROGRAM],
    ['integer', TokenType.INTEGER],
    ['boolean', TokenType.BOOLEAN],
    ['string', TokenType.STRING],
    ['write', TokenType.WRITE],
    ['writeln', TokenType.WRITELN],
    ['read', TokenType.READ],
    ['function', TokenType.FUNCTION],
    ['procedure', TokenType.PROCEDURE],
    ['return', TokenType.RETURN],
    ['begin', TokenType.BEGIN],
    ['end', TokenType.END],
    ['if', TokenType.IF],
    ['then', TokenType.THEN],
    ['else', TokenType.ELSE],
    ['do', TokenType.DO],
    ['while', TokenType.WHILE],
    ['repeat', TokenType.REPEAT],
    ['until', TokenType.UNTIL],
    ['loop', TokenType.LOOP],
    ['for', TokenType.FOR],
    ['case', TokenType.CASE],
    ['of', TokenType.OF],
    ['otherwise', TokenType.OTHERWISE],
    ['var', TokenType.VAR],
    ['when', TokenType.WHEN],
    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],
    ['exit', TokenType.EXIT],
    ['and', TokenType.AND],
    ['or', TokenType.OR],
    ['xor', TokenType.XOR],
    ['in', TokenType.IN],
    ['mod', TokenType.MOD],
    ['not', TokenType.NOT],
    ['max', TokenType.MAX],
    ['min', TokenType.MIN],
    ['to', TokenType.TO]
  ]);

  public errors: LexicalError[] = [];

  // Temporary variables for token generation
  private lexeme: string = '';
  private numValue: number = 0;
  private stringCount: number = 0;
  private idCount: number = 0;
  private outOfBounds: boolean = false;

  // Symbol table integration (like Java ALex)
  private symbolTable: SymbolTable | null = null;
  private declarationZone: boolean = false;

  // Stop at variables
  private stopAtLine: number | null = null;
  private stopAtColumn: number | null = null;

  private lastToken: Token | null = null;

  constructor(input: string, symbolTable?: SymbolTable) {
    this.input = input;
    this.position = -1;
    this.line = 1;
    this.column = -1;
    this.currentCharCode = -1;
    this.symbolTable = symbolTable || null;

    this.buildOCExclude();
    this.buildTransitionMatrix();
    this.read(); // Read first character
  }

  /**
   * Set the symbol table for identifier validation
   */
  public setSymbolTable(symbolTable: SymbolTable): void {
    this.symbolTable = symbolTable;
  }

  /**
   * Set whether we are in a declaration zone
   * In declaration zones, identifiers are inserted into the symbol table
   * Outside declaration zones, identifiers must already exist
   */
  public setDeclarationZone(isDeclarationZone: boolean): void {
    this.declarationZone = isDeclarationZone;
  }

  /**
   * Get the current declaration zone state
   */
  public isInDeclarationZone(): boolean {
    return this.declarationZone;
  }

  /**
   * Set stop at position for variable analysis (for go-to-definition)
   */
  public setStopAt(line: number, column: number): void {
    this.stopAtLine = line;
    this.stopAtColumn = column;
  }

  /**
   * Build the ocExclude map that defines which columns are NOT treated as "other character"
   * for each state
   */
  private buildOCExclude(): void {
    // State 1: exclude column 8 (=)
    this.ocExclude.set(1, new Set([8]));

    // State 2: exclude columns 15 ('), 19 (EOF), 3 (LF), 21 (CR)
    this.ocExclude.set(2, new Set([15, 19, 3, 21]));

    // State 3: exclude columns 0 (letter), 1 (digit)
    this.ocExclude.set(3, new Set([0, 1]));

    // State 4: exclude column 1 (digit)
    this.ocExclude.set(4, new Set([1]));

    // State 5: exclude column 6 (*)
    this.ocExclude.set(5, new Set([6]));

    // State 6: exclude columns 14 (}), 19 (EOF), 3 (LF), 21 (CR)
    this.ocExclude.set(6, new Set([14, 19, 3, 21]));

    // State 7: exclude columns 10 (>), 8 (=)
    this.ocExclude.set(7, new Set([10, 8]));

    // State 8: exclude column 8 (=)
    this.ocExclude.set(8, new Set([8]));

    // State 9: exclude column 21 (CR)
    this.ocExclude.set(9, new Set([21]));

    // State 10: exclude column 3 (LF)
    this.ocExclude.set(10, new Set([3]));

    // State 11: exclude column 21 (CR)
    this.ocExclude.set(11, new Set([21]));

    // State 12: exclude column 3 (LF)
    this.ocExclude.set(12, new Set([3]));
  }

  /**
   * Build the transition matrix based on the MTD table
   */
  private buildTransitionMatrix(): void {
    // Initialize matrix with 13 states and 22 columns
    for (let i = 0; i < 13; i++) {
      this.transitionMatrix[i] = new Array(22).fill(null);
    }

    // Define transitions based on the MTD table
    const transitions: [number, number, number, Action][] = [
      // State 0 - Initial state
      [0, 3, 0, Action.A0_3],          // letter
      [0, 4, 1, Action.A0_4],          // digit
      [0, 0, 2, Action.Read],          // tab/space
      [0, 9, 3, Action.EOL],           // LF
      [0, 888, 4, Action.A0_100],      // +
      [0, 888, 5, Action.A0_101],      // -
      [0, 5, 6, Action.Read],          // * (could be comment)
      [0, 888, 7, Action.A0_102],      // /
      [0, 888, 8, Action.A0_103],      // =
      [0, 7, 9, Action.Read],          // <
      [0, 1, 10, Action.Read],         // >
      [0, 888, 11, Action.A0_104],     // (
      [0, 888, 12, Action.A0_105],     // )
      [0, 6, 13, Action.Read],         // {
      [0, 888, 14, Action.ELEX0_ILLEGAL_COMMENT_CLOSE], // }
      [0, 2, 15, Action.A0_2],         // '
      [0, 888, 16, Action.A0_106],     // ;
      [0, 8, 17, Action.Read],         // :
      [0, 888, 18, Action.A0_107],     // ,
      [0, 888, 19, Action.A0_108],     // EOF
      [0, 888, 20, Action.ELEX0_ERROR_OC], // o.c
      [0, 10, 21, Action.EOL],         // CR

      // State 1 (>) - Greater than or >=
      [1, 888, 0, Action.A1_12],       // letter
      [1, 888, 1, Action.A1_12],       // digit
      [1, 888, 2, Action.A1_12],       // tab/space
      [1, 888, 3, Action.A1_12],       // LF
      [1, 888, 4, Action.A1_12],       // +
      [1, 888, 5, Action.A1_12],       // -
      [1, 888, 6, Action.A1_12],       // *
      [1, 888, 7, Action.A1_12],       // /
      [1, 888, 8, Action.A1_11],       // = (>=)
      [1, 888, 9, Action.A1_12],       // <
      [1, 888, 10, Action.A1_12],      // >
      [1, 888, 11, Action.A1_12],      // (
      [1, 888, 12, Action.A1_12],      // )
      [1, 888, 13, Action.A1_12],      // {
      [1, 888, 14, Action.A1_12],      // }
      [1, 888, 15, Action.A1_12],      // '
      [1, 888, 16, Action.A1_12],      // ;
      [1, 888, 17, Action.A1_12],      // :
      [1, 888, 18, Action.A1_12],      // ,
      [1, 888, 19, Action.A1_12],      // EOF
      [1, 888, 20, Action.A1_12],      // o.c
      [1, 888, 21, Action.A1_12],      // CR

      // State 2 (string)
      [2, 2, 0, Action.A2_2],          // letter
      [2, 2, 1, Action.A2_2],          // digit
      [2, 2, 2, Action.A2_2],          // tab/space
      [2, 0, 3, Action.ELEX2_ERROR_LINE_BREAK],    // LF
      [2, 2, 4, Action.A2_2],          // +
      [2, 2, 5, Action.A2_2],          // -
      [2, 2, 6, Action.A2_2],          // *
      [2, 2, 7, Action.A2_2],          // /
      [2, 2, 8, Action.A2_2],          // =
      [2, 2, 9, Action.A2_2],          // <
      [2, 2, 10, Action.A2_2],         // >
      [2, 2, 11, Action.A2_2],         // (
      [2, 2, 12, Action.A2_2],         // )
      [2, 2, 13, Action.A2_2],         // {
      [2, 2, 14, Action.A2_2],         // }
      [2, 888, 15, Action.A2_21],      // ' (end string)
      [2, 2, 16, Action.A2_2],         // ;
      [2, 2, 17, Action.A2_2],         // :
      [2, 2, 18, Action.A2_2],         // ,
      [2, 888, 19, Action.ELEX2_ERROR_INCOMPLETE_STRING], // EOF
      [2, 2, 20, Action.A2_2],         // o.c
      [2, 0, 21, Action.ELEX2_ERROR_LINE_BREAK],   // CR

      // State 3 (identifier)
      [3, 3, 0, Action.A3_3],          // letter
      [3, 3, 1, Action.A3_3],          // digit
      [3, 888, 2, Action.A3_31],       // tab/space
      [3, 888, 3, Action.A3_31],       // LF
      [3, 888, 4, Action.A3_31],       // +
      [3, 888, 5, Action.A3_31],       // -
      [3, 888, 6, Action.A3_31],       // *
      [3, 888, 7, Action.A3_31],       // /
      [3, 888, 8, Action.A3_31],       // =
      [3, 888, 9, Action.A3_31],       // <
      [3, 888, 10, Action.A3_31],      // >
      [3, 888, 11, Action.A3_31],      // (
      [3, 888, 12, Action.A3_31],      // )
      [3, 888, 13, Action.A3_31],      // {
      [3, 888, 14, Action.A3_31],      // }
      [3, 888, 15, Action.A3_31],      // '
      [3, 888, 16, Action.A3_31],      // ;
      [3, 888, 17, Action.A3_31],      // :
      [3, 888, 18, Action.A3_31],      // ,
      [3, 888, 19, Action.A3_31],      // EOF
      [3, 888, 20, Action.A3_31],      // o.c
      [3, 888, 21, Action.A3_31],      // CR

      // State 4 (number)
      [4, 888, 0, Action.A4_41],       // letter
      [4, 4, 1, Action.A4_4],          // digit
      [4, 888, 2, Action.A4_41],       // tab/space
      [4, 888, 3, Action.A4_41],       // LF
      [4, 888, 4, Action.A4_41],       // +
      [4, 888, 5, Action.A4_41],       // -
      [4, 888, 6, Action.A4_41],       // *
      [4, 888, 7, Action.A4_41],       // /
      [4, 888, 8, Action.A4_41],       // =
      [4, 888, 9, Action.A4_41],       // <
      [4, 888, 10, Action.A4_41],      // >
      [4, 888, 11, Action.A4_41],      // (
      [4, 888, 12, Action.A4_41],      // )
      [4, 888, 13, Action.A4_41],      // {
      [4, 888, 14, Action.A4_41],      // }
      [4, 888, 15, Action.A4_41],      // '
      [4, 888, 16, Action.A4_41],      // ;
      [4, 888, 17, Action.A4_41],      // :
      [4, 888, 18, Action.A4_41],      // ,
      [4, 888, 19, Action.A4_41],      // EOF
      [4, 888, 20, Action.A4_41],      // o.c
      [4, 888, 21, Action.A4_41],      // CR

      // State 5 (after *) - Could be ^ or just *
      [5, 888, 0, Action.A5_52],       // letter
      [5, 888, 1, Action.A5_52],       // digit
      [5, 888, 2, Action.A5_52],       // tab/space
      [5, 888, 3, Action.A5_52],       // LF
      [5, 888, 4, Action.A5_52],       // +
      [5, 888, 5, Action.A5_52],       // -
      [5, 888, 6, Action.A5_51],       // * (becomes ^)
      [5, 888, 7, Action.A5_52],       // /
      [5, 888, 8, Action.A5_52],       // =
      [5, 888, 9, Action.A5_52],       // <
      [5, 888, 10, Action.A5_52],      // >
      [5, 888, 11, Action.A5_52],      // (
      [5, 888, 12, Action.A5_52],      // )
      [5, 888, 13, Action.A5_52],      // {
      [5, 888, 14, Action.A5_52],      // }
      [5, 888, 15, Action.A5_52],      // '
      [5, 888, 16, Action.A5_52],      // ;
      [5, 888, 17, Action.A5_52],      // :
      [5, 888, 18, Action.A5_52],      // ,
      [5, 888, 19, Action.A5_52],      // EOF
      [5, 888, 20, Action.A5_52],      // o.c
      [5, 888, 21, Action.A5_52],      // CR

      // State 6 (comment)
      [6, 6, 0, Action.Read],          // letter
      [6, 6, 1, Action.Read],          // digit
      [6, 6, 2, Action.Read],          // tab/space
      [6, 11, 3, Action.EOL],          // LF
      [6, 6, 4, Action.Read],          // +
      [6, 6, 5, Action.Read],          // -
      [6, 6, 6, Action.Read],          // *
      [6, 6, 7, Action.Read],          // /
      [6, 6, 8, Action.Read],          // =
      [6, 6, 9, Action.Read],          // <
      [6, 6, 10, Action.Read],         // >
      [6, 6, 11, Action.Read],         // (
      [6, 6, 12, Action.Read],         // )
      [6, 6, 13, Action.Read],         // {
      [6, 0, 14, Action.Read],         // } (end comment)
      [6, 6, 15, Action.Read],         // '
      [6, 6, 16, Action.Read],         // ;
      [6, 6, 17, Action.Read],         // :
      [6, 6, 18, Action.Read],         // ,
      [6, 888, 19, Action.ELEX6_ERROR_UNCLOSED_COMMENT], // EOF
      [6, 6, 20, Action.Read],         // o.c
      [6, 12, 21, Action.EOL],         // CR

      // State 7 (<) - Less than, <>, or <=
      [7, 888, 0, Action.A7_71],       // letter
      [7, 888, 1, Action.A7_71],       // digit
      [7, 888, 2, Action.A7_71],       // tab/space
      [7, 888, 3, Action.A7_71],       // LF
      [7, 888, 4, Action.A7_71],       // +
      [7, 888, 5, Action.A7_71],       // -
      [7, 888, 6, Action.A7_71],       // *
      [7, 888, 7, Action.A7_71],       // /
      [7, 888, 8, Action.A7_73],       // = (<=)
      [7, 888, 9, Action.A7_71],       // <
      [7, 888, 10, Action.A7_72],      // > (<>)
      [7, 888, 11, Action.A7_71],      // (
      [7, 888, 12, Action.A7_71],      // )
      [7, 888, 13, Action.A7_71],      // {
      [7, 888, 14, Action.A7_71],      // }
      [7, 888, 15, Action.A7_71],      // '
      [7, 888, 16, Action.A7_71],      // ;
      [7, 888, 17, Action.A7_71],      // :
      [7, 888, 18, Action.A7_71],      // ,
      [7, 888, 19, Action.A7_71],      // EOF
      [7, 888, 20, Action.A7_71],      // o.c
      [7, 888, 21, Action.A7_71],      // CR

      // State 8 (:) - Colon or :=
      [8, 888, 0, Action.A8_81],       // letter
      [8, 888, 1, Action.A8_81],       // digit
      [8, 888, 2, Action.A8_81],       // tab/space
      [8, 888, 3, Action.A8_81],       // LF
      [8, 888, 4, Action.A8_81],       // +
      [8, 888, 5, Action.A8_81],       // -
      [8, 888, 6, Action.A8_81],       // *
      [8, 888, 7, Action.A8_81],       // /
      [8, 888, 8, Action.A8_82],       // = (:=)
      [8, 888, 9, Action.A8_81],       // <
      [8, 888, 10, Action.A8_81],      // >
      [8, 888, 11, Action.A8_81],      // (
      [8, 888, 12, Action.A8_81],      // )
      [8, 888, 13, Action.A8_81],      // {
      [8, 888, 14, Action.A8_81],      // }
      [8, 888, 15, Action.A8_81],      // '
      [8, 888, 16, Action.A8_81],      // ;
      [8, 888, 17, Action.A8_81],      // :
      [8, 888, 18, Action.A8_81],      // ,
      [8, 888, 19, Action.A8_81],      // EOF
      [8, 888, 20, Action.A8_81],      // o.c
      [8, 888, 21, Action.A8_81],      // CR

      // State 9 (after LF waiting for CR) - newline handling
      [9, 0, 0, Action.None],          // letter
      [9, 0, 1, Action.None],          // digit
      [9, 0, 2, Action.None],          // tab/space
      [9, 0, 3, Action.None],          // LF
      [9, 0, 4, Action.None],          // +
      [9, 0, 5, Action.None],          // -
      [9, 0, 6, Action.None],          // *
      [9, 0, 7, Action.None],          // /
      [9, 0, 8, Action.None],          // =
      [9, 0, 9, Action.None],          // <
      [9, 0, 10, Action.None],         // >
      [9, 0, 11, Action.None],         // (
      [9, 0, 12, Action.None],         // )
      [9, 0, 13, Action.None],         // {
      [9, 0, 14, Action.None],         // }
      [9, 0, 15, Action.None],         // '
      [9, 0, 16, Action.None],         // ;
      [9, 0, 17, Action.None],         // :
      [9, 0, 18, Action.None],         // ,
      [9, 0, 19, Action.None],         // EOF
      [9, 0, 20, Action.None],         // o.c
      [9, 0, 21, Action.Read],         // CR

      // State 10 (after CR waiting for LF) - newline handling
      [10, 0, 0, Action.None],         // letter
      [10, 0, 1, Action.None],         // digit
      [10, 0, 2, Action.None],         // tab/space
      [10, 0, 3, Action.Read],         // LF
      [10, 0, 4, Action.None],         // +
      [10, 0, 5, Action.None],         // -
      [10, 0, 6, Action.None],         // *
      [10, 0, 7, Action.None],         // /
      [10, 0, 8, Action.None],         // =
      [10, 0, 9, Action.None],         // <
      [10, 0, 10, Action.None],        // >
      [10, 0, 11, Action.None],        // (
      [10, 0, 12, Action.None],        // )
      [10, 0, 13, Action.None],        // {
      [10, 0, 14, Action.None],        // }
      [10, 0, 15, Action.None],        // '
      [10, 0, 16, Action.None],        // ;
      [10, 0, 17, Action.None],        // :
      [10, 0, 18, Action.None],        // ,
      [10, 0, 19, Action.None],        // EOF
      [10, 0, 20, Action.None],        // o.c
      [10, 0, 21, Action.None],        // CR

      // State 11 (comment after LF waiting for CR)
      [11, 6, 0, Action.None],         // letter
      [11, 6, 1, Action.None],         // digit
      [11, 6, 2, Action.None],         // tab/space
      [11, 6, 3, Action.None],         // LF
      [11, 6, 4, Action.None],         // +
      [11, 6, 5, Action.None],         // -
      [11, 6, 6, Action.None],         // *
      [11, 6, 7, Action.None],         // /
      [11, 6, 8, Action.None],         // =
      [11, 6, 9, Action.None],         // <
      [11, 6, 10, Action.None],        // >
      [11, 6, 11, Action.None],        // (
      [11, 6, 12, Action.None],        // )
      [11, 6, 13, Action.None],        // {
      [11, 6, 14, Action.None],        // }
      [11, 6, 15, Action.None],        // '
      [11, 6, 16, Action.None],        // ;
      [11, 6, 17, Action.None],        // :
      [11, 6, 18, Action.None],        // ,
      [11, 6, 19, Action.None],        // EOF
      [11, 6, 20, Action.None],        // o.c
      [11, 6, 21, Action.Read],        // CR

      // State 12 (comment after CR waiting for LF)
      [12, 6, 0, Action.None],         // letter
      [12, 6, 1, Action.None],         // digit
      [12, 6, 2, Action.None],         // tab/space
      [12, 6, 3, Action.Read],         // LF
      [12, 6, 4, Action.None],         // +
      [12, 6, 5, Action.None],         // -
      [12, 6, 6, Action.None],         // *
      [12, 6, 7, Action.None],         // /
      [12, 6, 8, Action.None],         // =
      [12, 6, 9, Action.None],         // <
      [12, 6, 10, Action.None],        // >
      [12, 6, 11, Action.None],        // (
      [12, 6, 12, Action.None],        // )
      [12, 6, 13, Action.None],        // {
      [12, 6, 14, Action.None],        // }
      [12, 6, 15, Action.None],        // '
      [12, 6, 16, Action.None],        // ;
      [12, 6, 17, Action.None],        // :
      [12, 6, 18, Action.None],        // ,
      [12, 6, 19, Action.None],        // EOF
      [12, 6, 20, Action.None],        // o.c
      [12, 6, 21, Action.None],        // CR
    ];

    // Populate the transition matrix
    for (const [state, nextState, column, action] of transitions) {
      this.transitionMatrix[state][column] = new TransitionEntry(nextState, action);
    }
  }

  /**
   * Read the next character from input
   */
  private read(): void {
    this.position++;
    this.column++;

    if (this.position >= this.input.length) {
      this.currentCharCode = -1; // EOF
    } else {
      this.currentCharCode = this.input.charCodeAt(this.position);
    }
  }

  /**
   * Get the column index in the transition matrix for a given character code
   * Maps character codes to their respective column in the transition matrix
   *
   * Columns:
   * 0=letter, 1=digit, 2=tab/space, 3=LF, 4=+, 5=-, 6=*, 7=/, 8==, 9=<, 10=>,
   * 11=(, 12=), 13={, 14=}, 15=', 16=;, 17=:, 18=,, 19=EOF, 20=o.c, 21=CR
   */
  private getColumnIndex(state: number, charCode: number): number {
    let column = 20; // Default to "other character"

    // Letter (a-z, A-Z)
    if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
      column = 0;
    }
    // Digit (0-9)
    else if (charCode >= 48 && charCode <= 57) {
      column = 1;
    }
    // Tab or Space
    else if (charCode === 9 || charCode === 32) {
      column = 2;
    }
    // LF (Line Feed)
    else if (charCode === 10) {
      column = 3;
    }
    // +
    else if (charCode === 43) {
      column = 4;
    }
    // -
    else if (charCode === 45) {
      column = 5;
    }
    // *
    else if (charCode === 42) {
      column = 6;
    }
    // /
    else if (charCode === 47) {
      column = 7;
    }
    // =
    else if (charCode === 61) {
      column = 8;
    }
    // <
    else if (charCode === 60) {
      column = 9;
    }
    // >
    else if (charCode === 62) {
      column = 10;
    }
    // (
    else if (charCode === 40) {
      column = 11;
    }
    // )
    else if (charCode === 41) {
      column = 12;
    }
    // {
    else if (charCode === 123) {
      column = 13;
    }
    // }
    else if (charCode === 125) {
      column = 14;
    }
    // '
    else if (charCode === 39) {
      column = 15;
    }
    // ;
    else if (charCode === 59) {
      column = 16;
    }
    // :
    else if (charCode === 58) {
      column = 17;
    }
    // ,
    else if (charCode === 44) {
      column = 18;
    }
    // EOF
    else if (charCode < 0) {
      column = 19;
    }
    // CR (Carriage Return)
    else if (charCode === 13) {
      column = 21;
    }

    // For state 0, return the column directly
    if (state === 0 && column !== 20) {
      return column;
    }

    // Check if this column should be treated as "other character" for this state
    const excludedColumns = this.ocExclude.get(state);
    if (excludedColumns && !excludedColumns.has(column)) {
      column = 20;
    }

    return column;
  }

  /**
   * Get the transition entry for the current state and character
   */
  private getTransition(state: number, charCode: number): TransitionEntry | null {
    const column = this.getColumnIndex(state, charCode);
    return this.transitionMatrix[state]?.[column] ?? null;
  }

  /**
   * Generate the next token using the state machine
   */
  private getNextTokenInternal(): Token | null {
    let state = 0;
    let prevState = 0;
    this.lexeme = '';

    // Store token start position (will be updated when we leave state 0)
    let startPosition = this.position;
    let startLine = this.line;
    let startColumn = this.column;

    while (state !== 888) {
      const transition = this.getTransition(state, this.currentCharCode);

      if (!transition) {
        // No valid transition - should not happen if MTD is complete
        this.errors.push({
          message: `Internal error: No transition for state ${state}, char code ${this.currentCharCode}`,
          line: this.line,
          column: this.column,
          position: this.position,
          length: 1
        });
        this.read();
        return null;
      }

      const action = transition.action;
      prevState = state;
      state = transition.nextState;

      // Update start position when transitioning from state 0 (whitespace state)
      // to any other state (actual token start)
      if (prevState === 0 && state !== 0) {
        startPosition = this.position;
        startLine = this.line;
        startColumn = this.column;
      }

      switch (action) {
        case Action.Read:
          this.read();
          break;

        case Action.EOL:
          this.read();
          this.line++;
          this.column = 0;
          break;

        case Action.None:
          break;

        // Greater than actions
        case Action.A1_11:
          this.read();
          return {
            type: TokenType.GREATER_EQUAL,
            lexeme: '>=',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A1_12:
          return {
            type: TokenType.GREATER_THAN,
            lexeme: '>',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        // String actions
        case Action.A0_2:
          this.stringCount = 0;
          this.read();
          break;

        case Action.A2_2:
          this.lexeme += String.fromCharCode(this.currentCharCode);
          this.stringCount++;
          this.read();
          break;

        case Action.A2_21:
          this.read();
          if (this.stringCount < 64) {
            return {
              type: TokenType.STRING_LITERAL,
              lexeme: this.lexeme,
              line: startLine,
              column: startColumn,
              position: startPosition
            };
          } else {
            this.errors.push({
              message: `String exceeds maximum length of 64 characters: '${this.lexeme}'`,
              line: startLine,
              column: startColumn,
              position: startPosition,
              length: this.stringCount + 2
            });
            return null;
          }

        // Identifier actions
        case Action.A0_3:
          this.lexeme = String.fromCharCode(this.currentCharCode);
          this.read();
          this.idCount = 1;
          break;

        case Action.A3_3:
          this.lexeme += String.fromCharCode(this.currentCharCode);
          this.idCount++;
          this.read();
          break;

        case Action.A3_31:
          if (this.idCount <= 32) {
            const upperLexeme = this.lexeme.toUpperCase();
            const lowerLexeme = this.lexeme.toLowerCase();
            const tokenType = this.keywords.get(lowerLexeme);

            // Check if it's a keyword
            if (tokenType) {
              return {
                type: tokenType,
                lexeme: this.lexeme,
                line: startLine,
                column: startColumn,
                position: startPosition
              };
            }

            // It's an identifier - insert or lookup in symbol table
            let symbol: BorealSymbol | undefined;

            if (this.symbolTable) {
              if (this.declarationZone) {
                // In declaration zone: insert identifier into symbol table
                const existing = this.symbolTable.lookupInCurrentScope(upperLexeme);
                if (existing) {
                  this.errors.push({
                    message: `Variable '${this.lexeme}' already declared in current scope`,
                    line: startLine,
                    column: startColumn,
                    position: startPosition,
                    length: this.idCount
                  });
                  return null;
                } else {
                  // Insert new symbol with UNKNOWN type (will be set by semantic analyzer)
                  const newSymbol: BorealSymbol = {
                    name: upperLexeme,
                    originalLexeme: this.lexeme,
                    kind: SymbolKind.UNKNOWN,
                    scope: this.symbolTable.getCurrentScopeName(),
                    position: startPosition,
                    line: startLine,
                    column: startColumn,
                    length: this.idCount
                  };
                  this.symbolTable.define(newSymbol);
                  symbol = newSymbol;
                }
              } else {
                // Outside declaration zone: lookup identifier
                symbol = this.symbolTable.lookup(upperLexeme);
                if (!symbol) {
                  this.errors.push({
                    message: `Variable '${this.lexeme}' not declared`,
                    line: startLine,
                    column: startColumn,
                    position: startPosition,
                    length: this.idCount
                  });
                  return null;
                }
              }
            }

            // Return the identifier token with symbol reference
            return {
              type: TokenType.IDENTIFIER,
              lexeme: this.lexeme,
              line: startLine,
              column: startColumn,
              position: startPosition,
              symbol: symbol
            };
          } else {
            this.errors.push({
              message: `Identifier exceeds maximum length of 32 characters: '${this.lexeme}'`,
              line: startLine,
              column: startColumn,
              position: startPosition,
              length: this.idCount
            });
            return null;
          }

        // Number actions
        case Action.A0_4:
          this.numValue = this.currentCharCode - 48; // '0'
          this.read();
          break;

        case Action.A4_4:
          this.numValue = this.numValue * 10 + (this.currentCharCode - 48);
          if (this.numValue > Math.pow(2, 15)) {
            this.outOfBounds = true;
          }
          this.read();
          break;

        case Action.A4_41:
          if (this.numValue < Math.pow(2, 15) && !this.outOfBounds) {
            const result = {
              type: TokenType.INTEGER_LITERAL,
              lexeme: this.numValue.toString(),
              line: startLine,
              column: startColumn,
              position: startPosition
            };
            this.outOfBounds = false;
            return result;
          } else {
            this.errors.push({
              message: `Integer exceeds maximum value of ${Math.pow(2, 15) - 1}: ${this.numValue}`,
              line: startLine,
              column: startColumn,
              position: startPosition,
              length: this.numValue.toString().length
            });
            this.outOfBounds = false;
            return null;
          }

        // Power/Multiply actions
        case Action.A5_51:
          this.read();
          return {
            type: TokenType.POWER,
            lexeme: '^',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A5_52:
          return {
            type: TokenType.MULTIPLY,
            lexeme: '*',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        // Less than actions
        case Action.A7_71:
          return {
            type: TokenType.LESS_THAN,
            lexeme: '<',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A7_72:
          this.read();
          return {
            type: TokenType.NOT_EQUAL,
            lexeme: '<>',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A7_73:
          this.read();
          return {
            type: TokenType.LESS_EQUAL,
            lexeme: '<=',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        // Colon actions
        case Action.A8_81:
          return {
            type: TokenType.COLON,
            lexeme: ':',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A8_82:
          this.read();
          return {
            type: TokenType.ASSIGN,
            lexeme: ':=',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        // Single character tokens
        case Action.A0_100:
          // Update start position for single char tokens
          startPosition = this.position;
          startLine = this.line;
          startColumn = this.column;
          this.read();
          return {
            type: TokenType.PLUS,
            lexeme: '+',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_101:
          this.read();
          return {
            type: TokenType.MINUS,
            lexeme: '-',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_102:
          this.read();
          return {
            type: TokenType.DIVIDE,
            lexeme: '/',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_103:
          this.read();
          return {
            type: TokenType.EQUAL,
            lexeme: '=',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_104:
          this.read();
          return {
            type: TokenType.LPAREN,
            lexeme: '(',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_105:
          this.read();
          return {
            type: TokenType.RPAREN,
            lexeme: ')',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_106:
          this.read();
          return {
            type: TokenType.SEMICOLON,
            lexeme: ';',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_107:
          this.read();
          return {
            type: TokenType.COMMA,
            lexeme: ',',
            line: startLine,
            column: startColumn,
            position: startPosition
          };

        case Action.A0_108:
          return {
            type: TokenType.EOF,
            lexeme: '',
            line: this.line,
            column: this.column,
            position: this.position
          };

        // Error actions
        case Action.ELEX0_ERROR_OC:
          this.errors.push({
            message: `Unexpected character: '${String.fromCharCode(this.currentCharCode)}'`,
            line: startLine,
            column: startColumn,
            position: startPosition,
            length: 1
          });
          this.read();
          return null;

        case Action.ELEX0_ILLEGAL_COMMENT_CLOSE:
          this.errors.push({
            message: `Illegal comment close '}'`,
            line: startLine,
            column: startColumn,
            position: startPosition,
            length: 1
          });
          return null;

        case Action.ELEX2_ERROR_LINE_BREAK:
          this.read();
          this.errors.push({
            message: `Unterminated string: line break not allowed`,
            line: startLine,
            column: startColumn,
            position: startPosition,
            length: this.lexeme.length + 1
          });
          return null;

        case Action.ELEX2_ERROR_INCOMPLETE_STRING:
          this.errors.push({
            message: `Unterminated string: EOF reached`,
            line: startLine,
            column: startColumn,
            position: startPosition,
            length: this.lexeme.length + 1
          });
          return null;

        case Action.ELEX6_ERROR_UNCLOSED_COMMENT:
          this.errors.push({
            message: `Unclosed comment: EOF reached`,
            line: startLine,
            column: startColumn,
            position: startPosition,
            length: 1
          });
          return null;

        default:
          return null;
      }
    }

    return null;
  }

  /**
   * Gets the next token from the input
   */
  public getNextToken(): Token | null {
    this.lastToken = this.getNextTokenInternal();
    if (this.stopAtLine != null && this.stopAtColumn != null) {
      if (this.line > this.stopAtLine || (this.line === this.stopAtLine && this.column > this.stopAtColumn)) {
        return null;
      }
    }

    return this.lastToken;
  }

  /**
   * Get last token read (for gathering information)
   */
  public getLastToken(): Token | null {
    return this.lastToken;
  }

  /**
   * Reset the lexer to reanalyze from the beginning
   * Useful when the parser needs to restart analysis
   */
  public reset(): void {
    this.position = -1;
    this.line = 1;
    this.column = -1;
    this.currentCharCode = -1;
    this.errors = [];
    this.lexeme = '';
    this.numValue = 0;
    this.stringCount = 0;
    this.idCount = 0;
    this.outOfBounds = false;
    this.read(); // Read first character
  }
}
