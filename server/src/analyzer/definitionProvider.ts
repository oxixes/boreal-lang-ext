import { TextDocument } from 'vscode-languageserver-textdocument';
import { Location, Position, Range } from 'vscode-languageserver/node';
import { IntegratedAnalyzer } from './analyzer';
import { Symbol as BorealSymbol, Scope } from '../types/symbol';

/**
 * Provides "Go to Definition" functionality for Boreal language
 *
 * This provider performs a full semantic analysis of the document
 * and uses the symbol table to locate definitions respecting scope rules.
 */
export class DefinitionProvider {
  /**
   * Find the definition location for a symbol at the given position
   *
   * @param textDocument The document to analyze
   * @param position The cursor position
   * @returns Location of the definition, or undefined if not found
   */
  public static findDefinition(textDocument: TextDocument, position: Position): Location | undefined {
    const text = textDocument.getText();

    // Get the symbol information at the given position
    const analyzer = new IntegratedAnalyzer(text);
    const result = analyzer.findSymbolDefinition(position.line + 1, position.character);
    if (!result) {
      return undefined;
    }

    // Create LSP Location object for the definition
    const definitionStart: Position = Position.create(result.line - 1, result.column);
    const definitionEnd: Position = Position.create(result.line - 1, result.column + (result.length || 1));

    return Location.create(
      textDocument.uri,
      Range.create(definitionStart, definitionEnd)
    );
  }
}
