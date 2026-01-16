import { Symbol, SymbolKind, Scope } from '../types/symbol';

/**
 * Symbol Table for managing scopes and symbols
 * Implements nested scopes for procedures and functions
 */
export class SymbolTable {
  private globalScope: Scope;
  private currentScope: Scope;
  private scopeStack: Scope[];

  constructor() {
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      children: []
    };
    this.currentScope = this.globalScope;
    this.scopeStack = [this.globalScope];
  }

  /**
   * Enter a new scope
   */
  public enterScope(scopeName: string): void {
    const newScope: Scope = {
      name: scopeName,
      parent: this.currentScope,
      symbols: new Map(),
      children: []
    };

    this.currentScope.children.push(newScope);
    this.currentScope = newScope;
    this.scopeStack.push(newScope);
  }

  /**
   * Exit the current scope
   */
  public exitScope(): void {
    if (this.scopeStack.length > 1) {
      this.scopeStack.pop();
      this.currentScope = this.scopeStack[this.scopeStack.length - 1];
    }
  }

  /**
   * Get current scope name
   */
  public getCurrentScopeName(): string {
    return this.currentScope.name;
  }

  /**
   * Define a new symbol in the current scope
   */
  public define(symbol: Symbol): boolean {
    // Check if symbol already exists in current scope
    if (this.currentScope.symbols.has(symbol.name.toLowerCase())) {
      return false;
    }

    this.currentScope.symbols.set(symbol.name.toLowerCase(), symbol);
    return true;
  }

  /**
   * Look up a symbol in the current scope and parent scopes
   */
  public lookup(name: string): Symbol | undefined {
    const lowerName = name.toLowerCase();

    // Search from current scope up to global scope
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      if (scope.symbols.has(lowerName)) {
        return scope.symbols.get(lowerName);
      }
    }

    return undefined;
  }

  /**
   * Look up a symbol only in the current scope
   */
  public lookupInCurrentScope(name: string): Symbol | undefined {
    return this.currentScope.symbols.get(name.toLowerCase());
  }

  /**
   * Get all symbols in the current scope
   */
  public getCurrentScopeSymbols(): Symbol[] {
    return Array.from(this.currentScope.symbols.values());
  }

  /**
   * Get all symbols (for debugging or completion)
   */
  public getAllSymbols(): Symbol[] {
    const symbols: Symbol[] = [];

    const collectSymbols = (scope: Scope) => {
      symbols.push(...Array.from(scope.symbols.values()));
      scope.children.forEach(child => collectSymbols(child));
    };

    collectSymbols(this.globalScope);
    return symbols;
  }

  /**
   * Get symbols accessible from current scope (for autocomplete)
   */
  public getAccessibleSymbols(): Symbol[] {
    const symbols: Symbol[] = [];

    // Collect symbols from all scopes in the stack
    for (const scope of this.scopeStack) {
      symbols.push(...Array.from(scope.symbols.values()));
    }

    return symbols;
  }

  /**
   * Check if a symbol is a function
   */
  public isFunction(name: string): boolean {
    const symbol = this.lookup(name);
    return symbol?.kind === SymbolKind.FUNCTION;
  }

  /**
   * Check if a symbol is a procedure
   */
  public isProcedure(name: string): boolean {
    const symbol = this.lookup(name);
    return symbol?.kind === SymbolKind.PROCEDURE;
  }

  /**
   * Check if a symbol is a variable
   */
  public isVariable(name: string): boolean {
    const symbol = this.lookup(name);
    return symbol?.kind === SymbolKind.VARIABLE || symbol?.kind === SymbolKind.PARAMETER;
  }

  /**
   * Reset the symbol table
   */
  public reset(): void {
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      children: []
    };
    this.currentScope = this.globalScope;
    this.scopeStack = [this.globalScope];
  }

  /**
   * Get the global scope
   */
  public getGlobalScope(): Scope {
    return this.globalScope;
  }

  /**
   * Print symbol table (for debugging)
   */
  public print(): string {
    const lines: string[] = [];

    const printScope = (scope: Scope, indent: string = '') => {
      lines.push(`${indent}Scope: ${scope.name}`);

      for (const [name, symbol] of scope.symbols) {
        const params = symbol.parameters ?
          `(${symbol.parameters.map(p => `${p.name}: ${p.dataType}`).join(', ')})` : '';
        const returnType = symbol.returnType ? `: ${symbol.returnType}` : '';
        lines.push(`${indent}  ${name}: ${symbol.kind} ${symbol.dataType}${params}${returnType}`);
      }

      for (const child of scope.children) {
        printScope(child, indent + '  ');
      }
    };

    printScope(this.globalScope);
    return lines.join('\n');
  }
}
