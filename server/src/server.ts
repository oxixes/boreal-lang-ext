import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Diagnostic,
  DiagnosticSeverity,
  DefinitionParams,
  Location
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { IntegratedAnalyzer } from './analyzer/analyzer';
import { DefinitionProvider } from './analyzer/definitionProvider';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

connection.console.log('Boreal Language Server starting...');

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support configuration?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      definitionProvider: true
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  return result;
});

connection.onInitialized(() => {
  connection.console.log('Server initialized successfully');

  if (hasConfigurationCapability) {
    // Register for configuration changes
    connection.onDidChangeConfiguration(() => {
      // Handle configuration changes if needed
      connection.console.log('Configuration changed.');
    });
  }

  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

/**
 * Validate a Boreal document
 */
async function validateDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  connection.console.log(`Validating document: ${textDocument.uri}`);
  connection.console.log(`Document content length: ${text.length}`);

  try {
    // Perform integrated analysis (lexical, syntactic, semantic)
    const analyzer = new IntegratedAnalyzer(text);
    const result = analyzer.analyze();

    connection.console.log(`Analysis complete - Lexical errors: ${result.lexicalErrors.length}, Syntax errors: ${result.syntaxErrors.length}, Semantic errors: ${result.semanticErrors.length}`);

    // Report lexical errors
    for (const error of result.lexicalErrors) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(error.position),
          end: textDocument.positionAt(error.position + (error.length))
        },
        message: error.message,
        source: 'boreal-lexer'
      });
    }

    // Report syntax errors
    for (const error of result.syntaxErrors) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(error.position),
          end: textDocument.positionAt(error.position + (error.length || 1))
        },
        message: error.message,
        source: 'boreal-parser'
      });
    }

    // Report semantic errors
    for (const error of result.semanticErrors) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(error.position || 0),
          end: textDocument.positionAt((error.position || 0) + (error.length || 1))
        },
        message: error.message,
        source: 'boreal-semantic'
      });
    }

    // Report semantic warnings
    for (const warning of result.semanticWarnings) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(warning.position || 0),
          end: textDocument.positionAt((warning.position || 0) + (warning.length || 1))
        },
        message: warning.message,
        source: 'boreal-semantic'
      });
    }

  } catch (error) {
    // Log unexpected errors
    connection.console.error(`Analysis error: ${error}`);
    if (error instanceof Error) {
      connection.console.error(`Stack: ${error.stack}`);
    }
  }

  connection.console.log(`Sending ${diagnostics.length} diagnostics`);

  // Send the computed diagnostics to the client
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// The content of a text document has changed
documents.onDidChangeContent(change => {
  connection.console.log(`Document changed: ${change.document.uri}`);
  validateDocument(change.document);
});

// Document opened
documents.onDidOpen(event => {
  connection.console.log(`Document opened: ${event.document.uri}`);
  validateDocument(event.document);
});

// Handle go to definition requests
connection.onDefinition((params: DefinitionParams): Location | undefined => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return undefined;
  }

  connection.console.log(`Definition request at ${params.position.line}:${params.position.character}`);

  try {
    const location = DefinitionProvider.findDefinition(document, params.position);
    if (location) {
      connection.console.log(`Found definition at ${location.range.start.line}:${location.range.start.character}`);
    } else {
      connection.console.log('No definition found');
    }
    return location;
  } catch (error) {
    connection.console.error(`Error finding definition: ${error}`);
    return undefined;
  }
});

// Make the text document manager listen on the connection
documents.listen(connection);

connection.console.log('Document manager listening on connection');

// Listen on the connection
connection.listen();

connection.console.log('Language server is ready and listening for requests');
