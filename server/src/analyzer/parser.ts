import * as fs from 'fs';
import * as path from 'path';
import { Token, TokenType } from '../types/token';
import { ASTNode, ASTNodeType, SyntaxError } from '../types/ast';
import { Lexer } from './lexer';
import { SymbolTable } from './symbolTable';
import { SemanticActions } from './semanticActions';
import { Symbol } from '../types/symbol';

/**
 * Action types for SLR parsing
 */
const SHIFT = 0;
const REDUCTION = 1;
const ACCEPTED = 2;

/**
 * SLR Action entry
 */
interface AccAction {
  type: number;  // SHIFT, REDUCTION, or ACCEPTED
  value: number; // State number for SHIFT, production number for REDUCTION
}

/**
 * Grammar production rule
 */
interface Rule {
  lhs: number;        // Left-hand side non-terminal ID
  rhsLength: number;  // Number of elements in right-hand side
}

/**
 * Semantic attributes (matching Java Atributos)
 */
export class Attributes {
  type?: string;
  symbol?: Symbol;   // Symbol table position
  val?: number;      // Integer value
  lex?: string;      // String lexeme
  node?: ASTNode;    // AST node
  exit?: number;     // Exit label
  ret?: string;      // Return info
  size?: number;     // Width/size
  length?: number;   // Length
  ref?: string;      // Reference
  names?: string;    // Names
  label?: string;    // Label
  program_count?: number; // Program counter

  // Position information for error reporting
  line?: number;
  column?: number;
  llength?: number;
  fullLength?: number;
  position?: number;

  // For return propagation
  retLine?: number;
  retColumn?: number;
  retLength?: number;
  retPosition?: number;

  // For exit propagation
  exitLine?: number;
  exitColumn?: number;
  exitLength?: number;
  exitPosition?: number;

  constructor() {
    // Initialize with empty values
  }
}

/**
 * Syntax Analyzer for Boreal Language
 * Implements Bottom-Up SLR parser based on Java ASin.java
 * Uses incremental tokenization from Lexer
 */
export class Parser {
  private static readonly NUM_TERMINALS = 59;

  private lexer: Lexer;
  public errors: SyntaxError[] = [];

  // Parsing stacks (matching Java implementation)
  private stateStack: number[];           // Stack of states
  public semanticStack: Attributes[];     // Stack of semantic attributes

  // SLR parsing tables
  private actionTable: Map<string, AccAction>;
  private gotoTable: Map<string, number>;
  private productions: Rule[];

  // Table metadata
  private columnIndexToId: Map<number, number>;
  private nonTerminalNameToId: Map<string, number>;

  // Token type to ID mapping
  private tokenTypeToId: Map<TokenType, number>;
  private idToTokenType: Map<number, TokenType>;

  // Semantic actions
  private semanticActions: SemanticActions;
  private symbolTable: SymbolTable;

  constructor(lexer: Lexer, symbolTable?: SymbolTable) {
    this.lexer = lexer;
    this.errors = [];

    // Initialize stacks with initial state 0
    this.stateStack = [0];
    this.semanticStack = [{}];

    // Initialize parsing tables
    this.actionTable = new Map();
    this.gotoTable = new Map();
    this.productions = [];

    this.columnIndexToId = new Map();
    this.nonTerminalNameToId = new Map();

    // Initialize token mappings
    this.tokenTypeToId = new Map();
    this.idToTokenType = new Map();
    this.initializeTokenMappings();

    // Load SLR tables
    this.initializeTables();

    // Initialize semantic actions
    this.symbolTable = symbolTable || new SymbolTable();
    this.semanticActions = new SemanticActions(this.symbolTable, this.lexer);
  }

  /**
   * Map TokenType to token IDs (matching the SLR table columns)
   */
  private initializeTokenMappings(): void {
    const mappings: [TokenType, number][] = [
      [TokenType.PROGRAM, 0],
      [TokenType.SEMICOLON, 1],
      [TokenType.IDENTIFIER, 2],
      [TokenType.PROCEDURE, 3],
      [TokenType.FUNCTION, 4],
      [TokenType.COLON, 5],
      [TokenType.VAR, 6],
      [TokenType.BOOLEAN, 7],
      [TokenType.INTEGER, 8],
      [TokenType.STRING, 9],
      [TokenType.LPAREN, 10],
      [TokenType.RPAREN, 11],
      [TokenType.IF, 12],
      [TokenType.THEN, 13],
      [TokenType.BEGIN, 14],
      [TokenType.END, 15],
      [TokenType.ELSE, 16],
      [TokenType.WHILE, 17],
      [TokenType.DO, 18],
      [TokenType.REPEAT, 19],
      [TokenType.UNTIL, 20],
      [TokenType.LOOP, 21],
      [TokenType.FOR, 22],
      [TokenType.ASSIGN, 23],
      [TokenType.TO, 24],
      [TokenType.CASE, 25],
      [TokenType.OF, 26],
      [TokenType.INTEGER_LITERAL, 27],
      [TokenType.OTHERWISE, 28],
      [TokenType.WRITE, 29],
      [TokenType.WRITELN, 30],
      [TokenType.READ, 31],
      [TokenType.RETURN, 32],
      [TokenType.EXIT, 33],
      [TokenType.WHEN, 34],
      [TokenType.COMMA, 35],
      [TokenType.OR, 36],
      [TokenType.XOR, 37],
      [TokenType.AND, 38],
      [TokenType.EQUAL, 39],
      [TokenType.NOT_EQUAL, 40],
      [TokenType.GREATER_THAN, 41],
      [TokenType.GREATER_EQUAL, 42],
      [TokenType.LESS_THAN, 43],
      [TokenType.LESS_EQUAL, 44],
      [TokenType.PLUS, 45],
      [TokenType.MINUS, 46],
      [TokenType.MULTIPLY, 47],
      [TokenType.DIVIDE, 48],
      [TokenType.MOD, 49],
      [TokenType.POWER, 50],
      [TokenType.NOT, 51],
      [TokenType.STRING_LITERAL, 52],
      [TokenType.TRUE, 53],
      [TokenType.FALSE, 54],
      [TokenType.IN, 55],
      [TokenType.MAX, 56],
      [TokenType.MIN, 57],
      [TokenType.EOF, 58]
    ];

    for (const [tokenType, id] of mappings) {
      this.tokenTypeToId.set(tokenType, id);
      this.idToTokenType.set(id, tokenType);
    }
  }

  /**
   * Get token ID from TokenType
   */
  private getTokenId(tokenType: TokenType): number {
    return this.tokenTypeToId.get(tokenType) ?? 58; // Default to EOF
  }

  /**
   * Get TOKEN table key for ACTION/GOTO lookup
   */
  private getTableKey(state: number, tokenId: number): string {
    return `${state}:${tokenId}`;
  }

  /**
   * Read and split the SLR table CSV file
   */
  private readSlrTable(): { header: string[]; rows: string[][] } {
    const tablePath = this.resolveSlrTablePath();
    const csvContent = fs.readFileSync(tablePath, 'utf8');
    const lines = csvContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error('SLR_data.csv is empty or missing');
    }

    const header = lines[0].split(',').map(cell => cell.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    return { header, rows };
  }

  /**
   * Resolve SLR_data.csv path for both ts-node (src) and compiled (out) layouts
   */
  private resolveSlrTablePath(): string {
    const candidates = [
      path.resolve(__dirname, '../../../core_data/SLR_data.csv'), // when running from ts-node (src/analyzer)
      path.resolve(__dirname, '../../../../core_data/SLR_data.csv'), // when running compiled JS (out/server/src/analyzer)
      path.resolve(process.cwd(), 'core_data/SLR_data.csv') // fallback to workspace root
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new Error('SLR_data.csv not found in expected locations');
  }

  /**
   * Build terminal/non-terminal index mapping from the CSV header
   */
  private parseHeader(header: string[]): void {
    this.columnIndexToId.clear();
    this.nonTerminalNameToId.clear();

    for (let colIndex = 1; colIndex < header.length; colIndex++) {
      if (!header[colIndex]) {
        continue;
      }

      const normalized = header[colIndex].toUpperCase();
      if (normalized === 'FIN') {
        break;
      }

      if (colIndex <= Parser.NUM_TERMINALS) {
        this.columnIndexToId.set(colIndex, colIndex - 1);
      } else {
        this.columnIndexToId.set(colIndex, colIndex);
        this.nonTerminalNameToId.set(normalized, colIndex);
      }
    }
  }

  /**
   * Load grammar productions mirroring MT_ASINT.cargar_reglas()
   */
  private loadProductionsFromRules(): void {
    const rules = [
      'P -> M1 D R',
      'M1 -> Lambda',
      'R -> PP R',
      'R -> PF R',
      'R -> PR R',
      'R -> Lambda',
      'PP -> program PPid ; D M2 Bloque ;',
      'PPid -> Pid',
      'Pid -> id',
      'M2 -> Lambda',
      'PR -> procedure PRidA ; D M2 Bloque ;',
      'PRidA -> Pid A',
      'PF -> function PFidAT ; D M2 Bloque ;',
      'PFidAT -> Pid A : T',
      'D -> var id : T ; DD',
      'D -> Lambda',
      'DD -> id : T ; DD',
      'DD -> Lambda',
      'T -> boolean',
      'T -> integer',
      'T -> string',
      'A -> ( X id : T AA )',
      'A -> Lambda',
      'AA -> ; X id : T AA',
      'AA -> Lambda',
      'Bloque -> begin C end',
      'C -> B C',
      'C -> Lambda',
      'B -> if EE then S',
      'EE -> E',
      'B -> S',
      'B -> if EE then Bloque ;',
      'B -> if THEN else Bloque ;',
      'THEN -> EE then Bloque ;',
      'B -> while M3 EE do Bloque ;',
      'M3 -> Lambda',
      'B -> repeat M3 C until E ;',
      'B -> loop M3 C end ;',
      'B -> FOR do Bloque ;',
      'FOR -> for id := E to E',
      'B -> case EXP of N O end ;',
      'EXP -> E',
      'N -> N VALOR : Bloque ;',
      'VALOR -> entero',
      'N -> Lambda',
      'O -> otherwise : M3 Bloque ;',
      'O -> Lambda',
      'S -> write LL ;',
      'S -> writeln LL ;',
      'S -> read ( V ) ;',
      'S -> id := E ;',
      'S -> id LL ;',
      'S -> return Y ;',
      'S -> exit when E ;',
      'LL -> ( L )',
      'LL -> Lambda',
      'L -> E Q',
      'Q -> , E Q',
      'Q -> Lambda',
      'V -> id W',
      'W -> , id W',
      'W -> Lambda',
      'Y -> E',
      'Y -> Lambda',
      'E -> E or F',
      'E -> E xor F',
      'E -> F',
      'F -> F and G',
      'F -> G',
      'G -> G = H',
      'G -> G <> H',
      'G -> G > H',
      'G -> G >= H',
      'G -> G < H',
      'G -> G <= H',
      'G -> H',
      'H -> H + I',
      'H -> H - I',
      'H -> I',
      'I -> I * J',
      'I -> I / J',
      'I -> I mod J',
      'I -> J',
      'J -> J ** K',
      'J -> K',
      'K -> not K',
      'K -> + K',
      'K -> - K',
      'K -> Z',
      'Z -> entero',
      'Z -> cadena',
      'Z -> true',
      'Z -> false',
      'Z -> id LL',
      'Z -> ( E )',
      'Z -> Z in ( L )',
      'Z -> max ( L )',
      'Z -> min ( L )',
      'X -> var',
      'X -> Lambda'
    ];

    this.productions = new Array(rules.length + 1);
    this.productions[0] = { lhs: -1, rhsLength: 0 };

    rules.forEach((rule, index) => {
      const [lhs, rhs] = rule.split('->').map(part => part.trim());
      const lhsId = this.nonTerminalNameToId.get(lhs.toUpperCase());

      if (lhsId === undefined) {
        throw new Error(`Non-terminal ${lhs} not found in SLR table header`);
      }

      const rhsLength = rhs.toLowerCase() === 'lambda'
        ? 0
        : rhs.split(/\s+/).filter(Boolean).length;

      this.productions[index + 1] = { lhs: lhsId, rhsLength };
    });
  }

  /**
   * Initialize ACTION and GOTO tables
    * Loads the tables from the external SLR_data.csv file
   */
  private initializeTables(): void {
    const { header, rows } = this.readSlrTable();
    this.parseHeader(header);
    this.loadProductionsFromRules();
    this.loadActionTable(rows);
    this.loadGotoTable(rows);
  }

  /**
   * Load ACTION table entries from SLR data
   */
  private loadActionTable(rows: string[][]): void {
    this.actionTable.clear();

    rows.forEach((row, state) => {
      for (let colIndex = 1; colIndex < row.length; colIndex++) {
        const mappedId = this.columnIndexToId.get(colIndex);
        const cell = row[colIndex];

        if (mappedId === undefined || !cell || colIndex > Parser.NUM_TERMINALS) {
          continue;
        }

        const action = this.parseActionCell(cell);
        if (action) {
          this.actionTable.set(this.getTableKey(state, mappedId), action);
        }
      }
    });
  }

  /**
   * Load GOTO table entries
   */
  private loadGotoTable(rows: string[][]): void {
    this.gotoTable.clear();

    rows.forEach((row, state) => {
      for (let colIndex = 1; colIndex < row.length; colIndex++) {
        const mappedId = this.columnIndexToId.get(colIndex);
        const cell = row[colIndex];

        if (mappedId === undefined || !cell || colIndex <= Parser.NUM_TERMINALS) {
          continue;
        }

        const gotoState = this.parseGotoCell(cell);
        if (gotoState !== null) {
          this.gotoTable.set(this.getTableKey(state, mappedId), gotoState);
        }
      }
    });
  }

  private parseActionCell(cell: string): AccAction | null {
    const normalized = cell.trim();
    if (!normalized || normalized === '%') {
      return null;
    }

    const lower = normalized.toLowerCase();
    if (lower === 'accept') {
      return { type: ACCEPTED, value: 0 };
    }

    if (normalized.startsWith('s')) {
      const state = parseInt(normalized.substring(1), 10);
      return Number.isNaN(state) ? null : { type: SHIFT, value: state };
    }

    if (normalized.startsWith('r')) {
      const rule = parseInt(normalized.substring(1), 10);
      return Number.isNaN(rule) ? null : { type: REDUCTION, value: rule };
    }

    const numeric = parseInt(normalized, 10);
    return Number.isNaN(numeric) ? null : { type: SHIFT, value: numeric };
  }

  private parseGotoCell(cell: string): number | null {
    const normalized = cell.trim();
    if (!normalized || normalized === '%') {
      return null;
    }

    const numericText = normalized.startsWith('s') || normalized.startsWith('r')
      ? normalized.substring(1)
      : normalized;

    const state = parseInt(numericText, 10);
    return Number.isNaN(state) ? null : state;
  }

  /**
   * Parse the token stream using SLR algorithm (matching Java ASin.pedirTokens)
   * Returns the root AST node or null if parsing fails
   */
  public parse(): ASTNode | null {
    // Get first token from lexer
    let token: Token | null = this.lexer.getNextToken();

    // If null token received, stop analysis
    if (token === null) {
      return null;
    }

    // Main parsing loop (matching Java while(true) in pedirTokens)
    while (true) {
      const tokenId = this.getTokenId(token.type);
      const currentState = this.stateStack[this.stateStack.length - 1];

      // Lookup ACTION table
      const actionKey = this.getTableKey(currentState, tokenId);
      const action = this.actionTable.get(actionKey);

      // Error: no valid action found
      if (action === undefined) {
        // Find expected tokens for better error message
        const expectedTokens: string[] = [];
        for (let i = 0; i < Parser.NUM_TERMINALS; i++) {
          const testKey = this.getTableKey(currentState, i);
          if (this.actionTable.has(testKey)) {
            const tokenType = this.idToTokenType.get(i);
            if (tokenType) {
              expectedTokens.push(tokenType);
            }
          }
        }

        const message = expectedTokens.length > 0
          ? `Syntax error: unexpected '${token.lexeme || token.type}', expected one of: ${expectedTokens.join(', ')}`
          : `Syntax error: unexpected '${token.lexeme || token.type}'`;

        this.errors.push({
          message,
          line: token.line,
          column: token.column,
          position: token.position,
          expected: expectedTokens.length > 0 ? expectedTokens : undefined,
          found: token.type,
          length: token.lexeme.length
        });
        return null;
      }

      // SHIFT action
      if (action.type === SHIFT) {
        // Push terminal token ID to state stack
        this.stateStack.push(tokenId);

        // Push semantic attributes based on token type
        const attr: Attributes = {
          line: token.line,
          column: token.column,
          llength: token.length,
          fullLength: token.fullLength,
          position: token.position
        };
        if (token.type === TokenType.IDENTIFIER) {
          attr.type = token.type;
          attr.symbol = token.symbol; // Symbol table symbol
        } else if (token.type === TokenType.INTEGER_LITERAL) {
          attr.type = token.type;
          attr.val = parseInt(token.lexeme, 10);
        } else if (token.type === TokenType.STRING_LITERAL) {
          attr.type = token.type;
          attr.lex = token.lexeme;
        }
        this.semanticStack.push(attr);

        // Push new state
        this.stateStack.push(action.value);

        // Push empty attribute for state
        this.semanticStack.push({});

        // Get next token
        token = this.lexer.getNextToken();

        // If null token received, stop analysis
        if (token === null) {
          return null;
        }

      // REDUCTION action
      } else if (action.type === REDUCTION) {
        const production = this.productions[action.value];

        if (!production) {
          this.errors.push({
            message: `Invalid production number: ${action.value}`,
            line: token.line,
            column: token.column,
            position: token.position
          });
          return null;
        }

        // Execute semantic action for this production
        const resultAttributes = this.semanticActions.executeAction(action.value, this.semanticStack);

        // Calculate the full length of the reduced symbol by summing all RHS elements
        if (production.rhsLength > 0) {
            let totalLength = 0;
            let totalFullLength = 0;
            let firstPosition = -1;
            let firstLine = -1;
            let firstColumn = -1;

            // Iterate through RHS elements in the semantic stack
            for (let i = production.rhsLength; i > 0; i--) {
                const idx = this.semanticStack.length - (i * 2);
                if (idx >= 0 && idx < this.semanticStack.length) {
                    const attr = this.semanticStack[idx];
                    if (attr) {
                        if (firstPosition === -1 && attr.position !== undefined) {
                            firstPosition = attr.position;
                            firstLine = attr.line || 0;
                            firstColumn = attr.column || 0;
                            totalLength = attr.llength || 0;
                            totalFullLength = attr.fullLength || 0;
                        } else if (attr.fullLength !== undefined) {
                            totalLength += attr.fullLength;
                            totalFullLength += attr.fullLength;
                        }
                    }
                }
            }

            // Set combined length on result if we found any
            if (totalLength > 0 && !resultAttributes.llength) {
                resultAttributes.llength = totalLength;
            }
            if (totalFullLength > 0 && !resultAttributes.fullLength) {
                resultAttributes.fullLength = totalFullLength;
            }
            if (firstPosition >= 0 && !resultAttributes.position) {
                resultAttributes.position = firstPosition;
                resultAttributes.line = firstLine;
                resultAttributes.column = firstColumn;
            }
        }

        // Pop RHS elements and their states (2 * numElements)
        for (let i = 0; i < 2 * production.rhsLength; i++) {
          this.stateStack.pop();
          this.semanticStack.pop();
        }

        // Get current state after popping
        const currentState = this.stateStack[this.stateStack.length - 1];

        // Lookup GOTO table
        const gotoKey = this.getTableKey(currentState, production.lhs);
        const newState = this.gotoTable.get(gotoKey);

        if (newState === undefined) {
          this.errors.push({
            message: `No GOTO entry for state ${currentState} and non-terminal ${production.lhs}`,
            line: token.line,
            column: token.column,
            position: token.position
          });
          return null;
        }

        // Push LHS non-terminal
        this.stateStack.push(production.lhs);
        this.semanticStack.push(resultAttributes);

        // Push new state
        this.stateStack.push(newState);
        this.semanticStack.push({});

      // ACCEPTED
      } else if (action.type === ACCEPTED) {
        // Parsing successful
        // The semantic stack should contain the root AST node
        // After accepting, the stack has: [empty, nonterminal, attributes, state]
        // The AST root is in the semantic attribute at position 2
        if (this.semanticStack.length >= 3) {
          const rootAttributes = this.semanticStack[2];
          if (rootAttributes && rootAttributes.node) {
            return rootAttributes.node;
          }
        }

        // If no AST node was built, create a placeholder program node
        return {
          type: ASTNodeType.PROGRAM,
          name: 'root',
          declarations: [],
          body: {
            type: ASTNodeType.BLOCK,
            children: []
          }
        } as ASTNode;
      }
    }
  }

  /**
   * Get the semantic actions instance
   */
  public getSemanticActions(): SemanticActions {
    return this.semanticActions;
  }
}
