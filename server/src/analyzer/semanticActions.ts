import { Attributes } from './parser';
import { SymbolTable } from './symbolTable';
import { SymbolKind, DataType, SemanticError, Parameter } from '../types/symbol';
import { Lexer } from './lexer';

/**
 * Semantic Actions for Boreal Language Parser
 * Implements actions acc1-acc100 based on the grammar rules.
 */
export class SemanticActions {
    private symbolTable: SymbolTable;
    private declarationZone: boolean = false;
    private isGlobalScope: boolean = true;
    private globalDisplacement: number = 0;
    private localDisplacement: number = 0;
    private labelCounter: number = 2; // Starts at 2 as per Java numEtiq

    private lexer: Lexer;

    // Error tracking
    public errors: SemanticError[] = [];
    public warnings: SemanticError[] = [];

    constructor(symbolTable: SymbolTable, lexer: Lexer) {
        this.symbolTable = symbolTable;
        this.lexer = lexer;
    }

    private setDeclarationZone(isDeclaration: boolean): void {
        this.declarationZone = isDeclaration;
        this.lexer.setDeclarationZone(isDeclaration);
    }

    /**
     * Helper to get attribute from stack based on 1-based index in the RHS
     */
    private getAttribute(stack: Attributes[], index: number): Attributes {
        const attrIndex = stack.length - index - 1;
        return stack[attrIndex] || {};
    }

    private addError(message: string, position: number = 0, line: number = 0, column: number = 0, length: number = 0): void {
        this.errors.push({
            message,
            position,
            line,
            column,
            length,
            severity: 'error'
        });
    }

    private addErrorFromAttr(message: string, attr: Attributes): void {
        this.addError(message, attr.position || 0, attr.line || 0, attr.column || 0, attr.llength || 0);
    }

    private stringToDataType(typeStr: string): DataType {
        switch (typeStr) {
            case 'integer': return DataType.INTEGER;
            case 'real': return DataType.REAL;
            case 'logical': return DataType.BOOLEAN;
            case 'character': return DataType.CHAR; // if exists
            case 'string': return DataType.STRING;
            default: return DataType.VOID; // or handling unknown
        }
    }

    public executeAction(ruleNumber: number, semanticStack: Attributes[], ruleLength: number): Attributes {
        switch (ruleNumber) {
            case 1: return this.acc1(semanticStack);
            case 2: return this.acc2();
            case 3: return this.acc3(semanticStack);
            case 4: return this.acc4(semanticStack);
            case 5: return this.acc5(semanticStack);
            case 6: return this.acc6();
            case 7: return this.acc7(semanticStack);
            case 8: return this.acc8(semanticStack);
            case 9: return this.acc9(semanticStack);
            case 10: return this.acc10();
            case 11: return this.acc11(semanticStack);
            case 12: return this.acc12(semanticStack);
            case 13: return this.acc13(semanticStack);
            case 14: return this.acc14(semanticStack);
            case 15: return this.acc15(semanticStack);
            case 16: return this.acc16();
            case 17: return this.acc17(semanticStack);
            case 18: return this.acc18();
            case 19: return this.acc19();
            case 20: return this.acc20();
            case 21: return this.acc21();
            case 22: return this.acc22(semanticStack);
            case 23: return this.acc23();
            case 24: return this.acc24(semanticStack);
            case 25: return this.acc25();
            case 26: return this.acc26(semanticStack);
            case 27: return this.acc27(semanticStack);
            case 28: return this.acc28();
            case 29: return this.acc29(semanticStack);
            case 30: return this.acc30(semanticStack);
            case 31: return this.acc31(semanticStack);
            case 32: return this.acc32(semanticStack);
            case 33: return this.acc33(semanticStack);
            case 34: return this.acc34(semanticStack);
            case 35: return this.acc35(semanticStack);
            case 36: return this.acc36();
            case 37: return this.acc37(semanticStack);
            case 38: return this.acc38(semanticStack);
            case 39: return this.acc39(semanticStack);
            case 40: return this.acc40(semanticStack);
            case 41: return this.acc41(semanticStack);
            case 42: return this.acc42(semanticStack);
            case 43: return this.acc43(semanticStack);
            case 44: return this.acc44();
            case 45: return this.acc45();
            case 46: return this.acc46(semanticStack);
            case 47: return this.acc47();
            case 48: return this.acc48(semanticStack);
            case 49: return this.acc49(semanticStack);
            case 50: return this.acc50(semanticStack);
            case 51: return this.acc51(semanticStack);
            case 52: return this.acc52(semanticStack);
            case 53: return this.acc53(semanticStack);
            case 54: return this.acc54(semanticStack);
            case 55: return this.acc55(semanticStack);
            case 56: return this.acc56();
            case 57: return this.acc57(semanticStack);
            case 58: return this.acc58(semanticStack);
            case 59: return this.acc59();
            case 60: return this.acc60(semanticStack);
            case 61: return this.acc61(semanticStack);
            case 62: return this.acc62();
            case 63: return this.acc63(semanticStack);
            case 64: return this.acc64();
            case 65: return this.acc65(semanticStack);
            case 66: return this.acc66(semanticStack);
            case 67: return this.acc67(semanticStack);
            case 68: return this.acc68(semanticStack);
            case 69: return this.acc69(semanticStack);
            case 70: return this.acc70(semanticStack);
            case 71: return this.acc71(semanticStack);
            case 72: return this.acc72(semanticStack);
            case 73: return this.acc73(semanticStack);
            case 74: return this.acc74(semanticStack);
            case 75: return this.acc75(semanticStack);
            case 76: return this.acc76(semanticStack);
            case 77: return this.acc77(semanticStack);
            case 78: return this.acc78(semanticStack);
            case 79: return this.acc79(semanticStack);
            case 80: return this.acc80(semanticStack);
            case 81: return this.acc81(semanticStack);
            case 82: return this.acc82(semanticStack);
            case 83: return this.acc83(semanticStack);
            case 84: return this.acc84(semanticStack);
            case 85: return this.acc85(semanticStack);
            case 86: return this.acc86(semanticStack);
            case 87: return this.acc87(semanticStack);
            case 88: return this.acc88(semanticStack);
            case 89: return this.acc89(semanticStack);
            case 90: return this.acc90();
            case 91: return this.acc91();
            case 92: return this.acc92();
            case 93: return this.acc93();
            case 94: return this.acc94(semanticStack);
            case 95: return this.acc95(semanticStack);
            case 96: return this.acc96(semanticStack);
            case 97: return this.acc97(semanticStack);
            case 98: return this.acc98(semanticStack);
            case 99: return this.acc99();
            case 100: return this.acc100();
            default: return new Attributes();
        }
    }

    // ACC 1 - Check Program Count
    private acc1(stack: Attributes[]): Attributes {
        const rAtb = this.getAttribute(stack, 1);
        const count = rAtb.program_count || 0;
        if (count < 1) {
            this.addError("There must be a program declaration");
        } else if (count > 1) {
            this.addError("Only one program declaration can exist");
        }
        // destroy global table? reset scopes.
        // this.symbolTable.reset(); // Maybe not if we want to keep context
        return new Attributes();
    }

    // ACC 2 - Init Global Scope
    private acc2(): Attributes {
        this.symbolTable.reset();
        this.isGlobalScope = true;
        this.globalDisplacement = 0;
        this.setDeclarationZone(true);
        return new Attributes();
    }

    // ACC 3 - Program Count Increment
    private acc3(stack: Attributes[]): Attributes {
        const rAtb = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.program_count = 1 + (rAtb.program_count || 0);
        return res;
    }

    // ACC 4 - Propagate
    private acc4(stack: Attributes[]): Attributes {
        const rAtb = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.program_count = rAtb.program_count;
        return res;
    }

    // ACC 5 - Propagate
    private acc5(stack: Attributes[]): Attributes {
        const rAtb = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.program_count = rAtb.program_count;
        return res;
    }

    // ACC 6 - Base Program Count
    private acc6(): Attributes {
        const res = new Attributes();
        res.program_count = 0;
        return res;
    }

    // ACC 7 - Main Program Body
    private acc7(stack: Attributes[]): Attributes {
        const bloqueAtb = this.getAttribute(stack, 3);
        if (bloqueAtb.ret !== "type_ok" && bloqueAtb.ret !== "" && bloqueAtb.ret !== undefined) {
            this.addError("Main program with non-empty return instruction", bloqueAtb.retPosition || 0, bloqueAtb.retLine || 0, bloqueAtb.retColumn || 0, bloqueAtb.retLength || 0);
        }

        if ((bloqueAtb.exit || 0) > 0) {
            const pos = bloqueAtb.exitPosition || bloqueAtb.position || 0;
            const line = bloqueAtb.exitLine || bloqueAtb.line || 0;
            const col = bloqueAtb.exitColumn || bloqueAtb.column || 0;
            const len = bloqueAtb.exitLength || bloqueAtb.llength || 0;
            this.addError("Exit detected outside loop in Main Program", pos, line, col, len);
        }
        this.symbolTable.exitScope(); // destroy local
        this.isGlobalScope = true;
        this.setDeclarationZone(true);
        return new Attributes();
    }

    // ACC 8 - Main Program Definition
    private acc8(stack: Attributes[]): Attributes {
        const pidAtb = this.getAttribute(stack, 1);
        if (pidAtb.symbol) {
            pidAtb.symbol.kind = SymbolKind.PROGRAM; // Using PROGRAM/PROCEDURE
            pidAtb.symbol.parameters = []; // numParametro 0
            pidAtb.symbol.label = "main";
        }
        return new Attributes();
    }

    // ACC 9 - Start Local Scope
    private acc9(stack: Attributes[]): Attributes {
        this.isGlobalScope = false;
        this.localDisplacement = 0;

        // Ensure scope is created. SymbolTable enterScope creates new scope.
        // We probably need a name for the scope. Using ID from previous rule or just 'local'?
        // The Java code creates TSLocal.
        // Usually attached to the procedure name.
        // But acc9 just returns pos of ID.
        // We need to enter scope *somewhere*.
        // Java Procesador.gestorTS.createTSLocal() enters scope.
        // I will assume the previous token was the Procedure/Function ID and we should enter scope 'local'.
        // Wait, acc8 processed the ID. acc9 processes the ID for the body?
        // Rule 9: ??? -> ID ...
        const idAtb = this.getAttribute(stack, 1);

        // Enter scope named after the ID or just generic
        const scopeName = idAtb.symbol ? idAtb.symbol.name : 'local';
        this.symbolTable.enterScope(scopeName);

        const res = new Attributes();
        res.symbol = idAtb.symbol;
        return res;
    }

    // ACC 10 - End Declarations
    private acc10(): Attributes {
        this.setDeclarationZone(false);
        return new Attributes();
    }

    // ACC 11 - Check Procedure Body
    private acc11(stack: Attributes[]): Attributes {
        const bloqueAtb = this.getAttribute(stack, 3);
        if (bloqueAtb.type === "type_error")
            this.addError("Error detected in the procedure body", 0, bloqueAtb.line || 0, bloqueAtb.column || 0, bloqueAtb.llength || 0);
        if (bloqueAtb.ret !== "" && bloqueAtb.ret !== "type_ok") {
            const pos = bloqueAtb.retPosition || 0;
            const line = bloqueAtb.retLine || 0;
            const col = bloqueAtb.retColumn || 0;
            const len = bloqueAtb.retLength || 0;
            this.addError("Procedure with non-empty return instruction", pos, line, col, len);
        }
        if ((bloqueAtb.exit || 0) > 0) {
            const pos = bloqueAtb.exitPosition || bloqueAtb.position || 0;
            const line = bloqueAtb.exitLine || bloqueAtb.line || 0;
            const col = bloqueAtb.exitColumn || bloqueAtb.column || 0;
            const len = bloqueAtb.exitLength || bloqueAtb.llength || 0;
            this.addError("Exit detected outside loop in Procedure", pos, line, col, len);
        }

        this.symbolTable.exitScope();
        this.isGlobalScope = true;
        this.setDeclarationZone(true);
        return new Attributes();
    }

    // ACC 12 - Procedure Definition
    private acc12(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const pidAtb = this.getAttribute(stack, 3);
        const aAtb = this.getAttribute(stack, 1);

        if (pidAtb.symbol) {
            pidAtb.symbol.kind = SymbolKind.PROCEDURE;
            pidAtb.symbol.label = "ProcLabel" + (this.labelCounter++);

            const params: Parameter[] = [];
            if ((aAtb.length || 0) > 0) {
                const tipos = aAtb.type ? aAtb.type.split(" ") : [];
                const modos = aAtb.ref ? aAtb.ref.split(" ") : [];

                for (let i = 0; i < tipos.length; i++) {
                    params.push({
                        name: 'param'+i,
                        dataType: this.stringToDataType(tipos[i]),
                        byReference: modos[i] === 'referencia'
                    });
                }
            }
            pidAtb.symbol.parameters = params;
        }
        res.label = (this.labelCounter - 1).toString();
        return res;
    }

    // ACC 13 - Check Function Body
    private acc13(stack: Attributes[]): Attributes {
        const bloqueAtb = this.getAttribute(stack, 3);
        const pfidatAtb = this.getAttribute(stack, 11); // Function ID attribute

        // Check return type
        if (bloqueAtb.ret !== pfidatAtb.type && bloqueAtb.ret !== "type_ok") {
            const pos = bloqueAtb.retPosition || 0;
            const line = bloqueAtb.retLine || 0;
            const col = bloqueAtb.retColumn || 0;
            const len = bloqueAtb.retLength || 0;
            this.addError("Function with invalid return", pos, line, col, len);
        } else if (bloqueAtb.ret === "type_ok" && pfidatAtb.type !== "void" && pfidatAtb.type !== "void") {
            this.addError("The function must return a value of type " + pfidatAtb.type, pfidatAtb.position || 0, pfidatAtb.line || 0, pfidatAtb.column || 0, pfidatAtb.llength || 0);
        }

        if ((bloqueAtb.exit || 0) > 0) {
            const pos = bloqueAtb.exitPosition || bloqueAtb.position || 0;
            const line = bloqueAtb.exitLine || bloqueAtb.line || 0;
            const col = bloqueAtb.exitColumn || bloqueAtb.column || 0;
            const len = bloqueAtb.exitLength || bloqueAtb.llength || 0;
            this.addError("Exit cannot be placed outside the loop", pos, line, col, len);
        }

        this.symbolTable.exitScope();
        this.isGlobalScope = true;
        this.setDeclarationZone(true);
        return new Attributes();
    }

    // ACC 14 - Function Definition
    private acc14(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const pidAtb = this.getAttribute(stack, 7);
        const aAtb = this.getAttribute(stack, 5);
        const tAtb = this.getAttribute(stack, 1);

        if (pidAtb.symbol) {
            pidAtb.symbol.kind = SymbolKind.FUNCTION;
            pidAtb.symbol.returnType = this.stringToDataType(tAtb.type || "");
            pidAtb.symbol.label = "FuncLabel" + (this.labelCounter++);

            const params: Parameter[] = [];
            if ((aAtb.length || 0) > 0) {
                const tipos = aAtb.type ? aAtb.type.split(" ") : [];
                const modos = aAtb.ref ? aAtb.ref.split(" ") : [];

                for (let i = 0; i < tipos.length; i++) {
                    params.push({
                        name: 'param'+i,
                        dataType: this.stringToDataType(tipos[i]),
                        byReference: modos[i] === 'referencia'
                    });
                }
            }
            pidAtb.symbol.parameters = params;
        }

        res.type = tAtb.type;
        res.label = (this.labelCounter - 1).toString();
        return res;
    }

    // ACC 15 & 17 - Variable Declaration
    private acc15(stack: Attributes[]): Attributes {
        const idAtb = this.getAttribute(stack, 9);
        const tAtb = this.getAttribute(stack, 5);

        if (idAtb.symbol) {
            idAtb.symbol.dataType = this.stringToDataType(tAtb.type || "");

            if (this.isGlobalScope) {
                idAtb.symbol.offset = this.globalDisplacement;
                this.globalDisplacement += (tAtb.size || 0);
            } else {
                idAtb.symbol.offset = this.localDisplacement;
                this.localDisplacement += (tAtb.size || 0);
            }
        }
        return new Attributes();
    }

    private acc17(stack: Attributes[]): Attributes {
        return this.acc15(stack); // Same logic
    }

    private acc16(): Attributes { return new Attributes(); }
    private acc18(): Attributes { return new Attributes(); }

    private acc19(): Attributes { // boolean type
        const res = new Attributes();
        res.type = "logical";
        res.size = 1;
        return res;
    }
    private acc20(): Attributes { // integer type
        const res = new Attributes();
        res.type = "integer";
        res.size = 1;
        return res;
    }
    private acc21(): Attributes { // string type
        const res = new Attributes();
        res.type = "string";
        res.size = 64;
        return res;
    }

    // ACC 22 - Parameters (Multiple)
    private acc22(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const idAtb = this.getAttribute(stack, 9);
        const tAtb = this.getAttribute(stack, 5);
        const xAtb = this.getAttribute(stack, 11);
        const aaAtb = this.getAttribute(stack, 3);

        const typeStr = tAtb.type || "";
        if (idAtb.symbol) {
            idAtb.symbol.dataType = this.stringToDataType(typeStr);
            idAtb.symbol.offset = this.localDisplacement;

            if (xAtb.ref === "reference") {
                idAtb.symbol.byReference = true; // "modoParametro" 1
                res.ref = "reference" + (aaAtb.ref ? " " + aaAtb.ref : "");
                this.localDisplacement += 1;
            } else {
                idAtb.symbol.byReference = false;
                res.ref = "value" + (aaAtb.ref ? " " + aaAtb.ref : "");
                this.localDisplacement += (tAtb.size || 0);
            }
        }

        if (aaAtb.type && aaAtb.type !== "") {
            res.type = typeStr + " " + aaAtb.type;
        } else {
            res.type = typeStr;
        }
        res.length = 1 + (aaAtb.length || 0);
        return res;
    }

    private acc23(): Attributes {
        const res = new Attributes();
        res.type = "";
        res.length = 0;
        return res;
    }

    // ACC 24 - Parameters (Last one/Single)
    private acc24(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const idAtb = this.getAttribute(stack, 7);
        const tAtb = this.getAttribute(stack, 3);
        const xAtb = this.getAttribute(stack, 9);
        const aaAtb = this.getAttribute(stack, 1);

        const typeStr = tAtb.type || "";
        if (idAtb.symbol) {
            idAtb.symbol.dataType = this.stringToDataType(typeStr);
            idAtb.symbol.offset = this.localDisplacement;

            if (xAtb.ref === "reference") {
                idAtb.symbol.byReference = true;
                res.ref = "reference" + (aaAtb.ref ? " " + aaAtb.ref : "");
                this.localDisplacement += 1;
            } else {
                idAtb.symbol.byReference = false;
                res.ref = "value" + (aaAtb.ref ? " " + aaAtb.ref : "");
                this.localDisplacement += (tAtb.size || 0);
            }
        }

        if (aaAtb.type && aaAtb.type !== "") {
            res.type = typeStr + " " + aaAtb.type;
        } else {
            res.type = typeStr;
        }
        res.length = 1 + (aaAtb.length || 0);
        return res;
    }

    private acc25(): Attributes { return this.acc23(); }

    private acc26(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const atb = this.getAttribute(stack, 3);
        res.type = atb.type;
        res.exit = atb.exit;
        res.ret = atb.ret;
        res.retLine = atb.retLine;
        res.retColumn = atb.retColumn;
        res.retLength = atb.retLength;
        res.retPosition = atb.retPosition;
        return res;
    }

    private acc27(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const bAtb = this.getAttribute(stack, 3);
        const cAtb = this.getAttribute(stack, 1);

        if (bAtb.type === "type_ok") res.type = cAtb.type;
        else res.type = "type_error";

        res.exit = (bAtb.exit || 0) + (cAtb.exit || 0);
        // Propagate exit position info
        res.exitPosition = bAtb.exitPosition || cAtb.exitPosition;
        res.exitLine = bAtb.exitLine || cAtb.exitLine;
        res.exitColumn = bAtb.exitColumn || cAtb.exitColumn;
        res.exitLength = bAtb.exitLength || cAtb.exitLength;

        const bRet = (bAtb.ret && bAtb.ret.length > 0) ? bAtb.ret : "type_ok";
        const cRet = (cAtb.ret && cAtb.ret.length > 0) ? cAtb.ret : "type_ok";

        if (bRet === cRet) {
             res.ret = bRet;
             res.retLine = bAtb.retLine || cAtb.retLine;
             res.retColumn = bAtb.retColumn || cAtb.retColumn;
             res.retLength = bAtb.retLength || cAtb.retLength;
             res.retPosition = bAtb.retPosition || cAtb.retPosition;
        } else if (bRet === "type_ok") {
             res.ret = cRet;
             res.retLine = cAtb.retLine;
             res.retColumn = cAtb.retColumn;
             res.retLength = cAtb.retLength;
             res.retPosition = cAtb.retPosition;
        } else if (cRet === "type_ok") {
             res.ret = bRet;
             res.retLine = bAtb.retLine;
             res.retColumn = bAtb.retColumn;
             res.retLength = bAtb.retLength;
             res.retPosition = bAtb.retPosition;
        } else {
            res.ret = "type_error";
            const line = cAtb.retLine || bAtb.retLine || 0;
            const col = cAtb.retColumn || bAtb.retColumn || 0;
            const len = cAtb.retLength || bAtb.retLength || 0;
            const pos = cAtb.retPosition || bAtb.retPosition || 0;
            this.addError("Return types of different types in subprogram", pos, line, col, len);

            res.retLine = line;
            res.retColumn = col;
            res.retLength = len;
            res.retPosition = pos;
        }
        return res;
    }

    private acc28(): Attributes {
        const res = new Attributes();
        res.type = "type_ok";
        res.exit = 0;
        res.ret = "type_ok";
        return res;
    }

    private acc29(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const eeAtb = this.getAttribute(stack, 5);
        const sAtb = this.getAttribute(stack, 1);

        if (eeAtb.type === "logical") res.type = sAtb.type;
        else {
            res.type = "type_error";
            if (eeAtb.type !== "type_error") {
                this.addErrorFromAttr(`The IF statement only accepts logical expressions.\n \t Received: [${eeAtb.type}]`, eeAtb);
            }
        }
        res.exit = sAtb.exit;
        res.ret = sAtb.ret;
        res.retLine = sAtb.retLine;
        res.retColumn = sAtb.retColumn;
        res.retLength = sAtb.retLength;
        res.retPosition = sAtb.retPosition;
        return res;
    }

    private acc30(stack: Attributes[]): Attributes {
        const pt = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.type = pt.type;
        return res;
    }

    private acc31(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const atb = this.getAttribute(stack, 1);
        res.type = atb.type;
        res.exit = atb.exit;
        res.ret = atb.ret;
        res.retLine = atb.retLine;
        res.retColumn = atb.retColumn;
        res.retLength = atb.retLength;
        res.retPosition = atb.retPosition;
        return res;
    }

    // acc32, acc33, acc34...
    private acc32(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const eeAtb = this.getAttribute(stack, 7);
        const bloqueAtb = this.getAttribute(stack, 3);

        if (eeAtb.type === "logical") res.type = bloqueAtb.type;
        else {
            res.type = "type_error";
            if (eeAtb.type !== "type_error") {
                this.addErrorFromAttr("Compound conditional statement with non-logical condition", eeAtb);
            }
        }
        res.exit = bloqueAtb.exit;
        res.ret = bloqueAtb.ret;
        res.retLine = bloqueAtb.retLine;
        res.retColumn = bloqueAtb.retColumn;
        res.retLength = bloqueAtb.retLength;
        res.retPosition = bloqueAtb.retPosition;
        return res;
    }

    private acc33(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const thenAtb = this.getAttribute(stack, 7);
        const bloqueAtb = this.getAttribute(stack, 3);

        if (thenAtb.type === "type_ok") res.type = bloqueAtb.type;
        else res.type = "type_error";

        res.exit = (thenAtb.exit || 0) + (bloqueAtb.exit || 0);
        // Propagate exit position
        res.exitPosition = thenAtb.exitPosition || bloqueAtb.exitPosition;
        res.exitLine = thenAtb.exitLine || bloqueAtb.exitLine;
        res.exitColumn = thenAtb.exitColumn || bloqueAtb.exitColumn;
        res.exitLength = thenAtb.exitLength || bloqueAtb.exitLength;

        if (thenAtb.ret === bloqueAtb.ret) {
             res.ret = bloqueAtb.ret;
             res.retLine = thenAtb.retLine || bloqueAtb.retLine;
             res.retColumn = thenAtb.retColumn || bloqueAtb.retColumn;
             res.retLength = thenAtb.retLength || bloqueAtb.retLength;
             res.retPosition = thenAtb.retPosition || bloqueAtb.retPosition;
        } else if (thenAtb.ret === "type_ok") {
             res.ret = bloqueAtb.ret;
             res.retLine = bloqueAtb.retLine;
             res.retColumn = bloqueAtb.retColumn;
             res.retLength = bloqueAtb.retLength;
             res.retPosition = bloqueAtb.retPosition;
        } else if (bloqueAtb.ret === "type_ok") {
             res.ret = thenAtb.ret;
             res.retLine = thenAtb.retLine;
             res.retColumn = thenAtb.retColumn;
             res.retLength = thenAtb.retLength;
             res.retPosition = thenAtb.retPosition;
        } else {
            res.ret = "type_error";
            const pos = thenAtb.retPosition || bloqueAtb.retPosition || 0;
            const line = thenAtb.retLine || bloqueAtb.retLine || 0;
            const col = thenAtb.retColumn || bloqueAtb.retColumn || 0;
            const len = thenAtb.retLength || bloqueAtb.retLength || 0;
            this.addError("Return instructions of different types in compound conditional statement", pos, line, col, len);

            res.retLine = line;
            res.retColumn = col;
            res.retLength = len;
            res.retPosition = pos;
        }
        return res;
    }

    // ... Implement others similarly
    // Jumping to complex ones or repetitive patterns

    private acc34(stack: Attributes[]): Attributes {
        return this.checkLogicAndPropagate(stack, 7, 3);
    }
    private acc35(stack: Attributes[]): Attributes {
        return this.checkLogicAndPropagate(stack, 7, 3);
    }
    private acc37(stack: Attributes[]): Attributes {
        return this.checkLogicAndPropagate(stack, 3, 7); // Swapped index
    }

    private checkLogicAndPropagate(stack: Attributes[], condIdx: number, blockIdx: number): Attributes {
        const res = new Attributes();
        const eeATB = this.getAttribute(stack, condIdx);
        const bloqueATB = this.getAttribute(stack, blockIdx);
        if (eeATB.type === "logical") {
            res.type = bloqueATB.type;
        } else {
            if (eeATB.type !== "type_error") {
                this.addError(`Incompatible type. Received: ${eeATB.type}; Expected: Logical`, eeATB.position || 0, eeATB.line || 0, eeATB.column || 0, eeATB.llength || 0);
            }
            res.type = "type_error";
        }
        res.exit = bloqueATB.exit;
        res.ret = bloqueATB.ret;
        res.retLine = bloqueATB.retLine;
        res.retColumn = bloqueATB.retColumn;
        res.retLength = bloqueATB.retLength;
        res.retPosition = bloqueATB.retPosition;
        return res;
    }

    private acc36(): Attributes { return new Attributes(); }

    private acc38(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const cATB = this.getAttribute(stack, 5);
        const loopATB = this.getAttribute(stack, 9);
        res.type = cATB.type;
        res.exit = 0;
        if (cATB.exit !== 1) {
             this.addErrorFromAttr("Loop: Must contain at least one exit", loopATB);
        }
        res.ret = cATB.ret;
        res.retLine = cATB.retLine;
        res.retColumn = cATB.retColumn;
        res.retLength = cATB.retLength;
        res.retPosition = cATB.retPosition;
        // Propagate exit position
        res.exitPosition = cATB.exitPosition;
        res.exitLine = cATB.exitLine;
        res.exitColumn = cATB.exitColumn;
        res.exitLength = cATB.exitLength;
        return res;
    }

    private acc39(stack: Attributes[]): Attributes {
         const res = new Attributes();
         const forATB = this.getAttribute(stack, 7);
         const bloqueATB = this.getAttribute(stack, 3);
         if (forATB.type === "type_ok") res.type = bloqueATB.type;
         else {
            // Don't report error if forATB already has type_error
            if (forATB.type !== "type_error") {
                this.addErrorFromAttr("Error in FOR loop", forATB);
            }
            res.type = "type_error";
         }
         res.exit = bloqueATB.exit;
         res.ret = bloqueATB.ret;
         res.retLine = bloqueATB.retLine;
         res.retColumn = bloqueATB.retColumn;
         res.retLength = bloqueATB.retLength;
         res.retPosition = bloqueATB.retPosition;
         // Propagate exit position
         res.exitPosition = bloqueATB.exitPosition;
         res.exitLine = bloqueATB.exitLine;
         res.exitColumn = bloqueATB.exitColumn;
         res.exitLength = bloqueATB.exitLength;
         return res;
    }

    private acc40(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const idATB = this.getAttribute(stack, 9);
        const e1ATB = this.getAttribute(stack, 5);
        const e2ATB = this.getAttribute(stack, 1);
        const forATB = this.getAttribute(stack, 11);

        const idSymbol = idATB.symbol;
        let idTipo = "unknown";
        if (idSymbol) {
             switch(idSymbol.dataType) {
                 case DataType.INTEGER: idTipo = "integer"; break;
                 // ...
                 default: idTipo = "integer"; // Assume integer if not found/void? Or check
             }
        }

        if (e1ATB.type === e2ATB.type && idTipo === e1ATB.type && e1ATB.type === "integer") {
            res.type = "type_ok";
        } else {
            if (e1ATB.type !== "type_error" && e2ATB.type !== "type_error") {
                this.addErrorFromAttr("Invalid for types", forATB);
            }
            res.type = "type_error";
        }
        return res;
    }

    private acc41(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const expATB = this.getAttribute(stack, 11);
        const nATB = this.getAttribute(stack, 7);
        const oATB = this.getAttribute(stack, 5);
        const caseATB = this.getAttribute(stack, 13);

        if (expATB.type === "integer" && nATB.type === oATB.type && oATB.type === "type_ok") {
            res.type = "type_ok";
        } else {
            if (oATB.type === "type_ok" && expATB.type !== "type_error")
                 this.addErrorFromAttr(`Invalid case types`, caseATB);
            res.type = "type_error";
        }
        res.exit = (nATB.exit || 0) + (oATB.exit || 0);
        // Propagate exit position
        res.exitPosition = nATB.exitPosition || oATB.exitPosition;
        res.exitLine = nATB.exitLine || oATB.exitLine;
        res.exitColumn = nATB.exitColumn || oATB.exitColumn;
        res.exitLength = nATB.exitLength || oATB.exitLength;

        // Ret logic...
        if (nATB.ret === oATB.ret || oATB.ret === "type_ok") {
             res.ret = nATB.ret;
             res.retLine = nATB.retLine;
             res.retColumn = nATB.retColumn;
             res.retLength = nATB.retLength;
             res.retPosition = nATB.retPosition;
        } else if (nATB.ret === "type_ok") {
             res.ret = oATB.ret;
             res.retLine = oATB.retLine;
             res.retColumn = oATB.retColumn;
             res.retLength = oATB.retLength;
             res.retPosition = oATB.retPosition;
        } else {
             res.ret = "type_error";
             const pos = nATB.retPosition || oATB.retPosition || 0;
             const line = nATB.retLine || oATB.retLine || 0;
             const col = nATB.retColumn || oATB.retColumn || 0;
             const len = nATB.retLength || oATB.retLength || 0;

             if (nATB.ret !== "type_error" && oATB.ret !== "type_error")
                this.addError("Incompatible return types in case", pos, line, col, len);

             res.retLine = line;
             res.retColumn = col;
             res.retLength = len;
             res.retPosition = pos;
        }

        return res;
    }

    private acc42(stack: Attributes[]): Attributes {
        const eATB = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.type = eATB.type;
        return res;
    }

    private acc43(stack: Attributes[]): Attributes {
        const nATB = this.getAttribute(stack, 9);
        const bloqueATB = this.getAttribute(stack, 3);
        const res = new Attributes();
        if (nATB.type === "type_ok") res.type = bloqueATB.type;
        else {
             if (nATB.type !== "type_error") {
                 this.addErrorFromAttr("Error in case", nATB);
             }
             res.type = "type_error";
        }
        res.exit = (nATB.exit || 0) + (bloqueATB.exit || 0);
        // Propagate exit position
        res.exitPosition = nATB.exitPosition || bloqueATB.exitPosition;
        res.exitLine = nATB.exitLine || bloqueATB.exitLine;
        res.exitColumn = nATB.exitColumn || bloqueATB.exitColumn;
        res.exitLength = nATB.exitLength || bloqueATB.exitLength;
        // ... return logic same as acc41 roughly
         if (nATB.ret === bloqueATB.ret || nATB.ret === "type_ok") {
            res.ret = bloqueATB.ret;
            res.retLine = bloqueATB.retLine;
            res.retColumn = bloqueATB.retColumn;
            res.retLength = bloqueATB.retLength;
            res.retPosition = bloqueATB.retPosition;
        } else if (bloqueATB.ret === "type_ok") {
            res.ret = nATB.ret;
            res.retLine = nATB.retLine;
            res.retColumn = nATB.retColumn;
            res.retLength = nATB.retLength;
            res.retPosition = nATB.retPosition;
        } else {
            res.ret = "type_error";
            const pos = nATB.retPosition || bloqueATB.retPosition || 0;
            const line = nATB.retLine || bloqueATB.retLine || 0;
            const col = nATB.retColumn || bloqueATB.retColumn || 0;
            const len = nATB.retLength || bloqueATB.retLength || 0;

            if (nATB.ret !== "type_error" && bloqueATB.ret !== "type_error")
                this.addError("Incompatible return types in case", pos, line, col, len);

            res.retLine = line;
            res.retColumn = col;
            res.retLength = len;
            res.retPosition = pos;
        }
        return res;
    }

    private acc44(): Attributes { return new Attributes(); }
    private acc45(): Attributes { return this.acc28(); } // ok/0/ok
    private acc46(stack: Attributes[]): Attributes {
        const bloqueATB = this.getAttribute(stack, 3);
        const res = new Attributes();
        res.type = bloqueATB.type;
        res.exit = bloqueATB.exit;
        res.ret = bloqueATB.ret;
        res.retLine = bloqueATB.retLine;
        res.retColumn = bloqueATB.retColumn;
        res.retLength = bloqueATB.retLength;
        res.retPosition = bloqueATB.retPosition;
        return res;
    }
    private acc47(): Attributes { return this.acc28(); }

    private acc48(stack: Attributes[]): Attributes {
        return this.checkWrite(stack, "WRITE");
    }
    private acc49(stack: Attributes[]): Attributes {
        return this.checkWrite(stack, "WRITELN");
    }

    private checkWrite(stack: Attributes[], stmt: string): Attributes {
        const res = new Attributes();
        const llATB = this.getAttribute(stack, 3);
        res.type = "type_ok";
        if (llATB.type) {
            const tipos = llATB.type.split(/\s+/);
            for (const tipo of tipos) {
                if (tipo !== "" && tipo !== "integer" && tipo !== "string" && tipo !== "type_error") {
                     this.addErrorFromAttr(`${stmt} only accepts integer or string, received ${tipo}`, llATB);
                     res.type = "type_error";
                     break;
                }
            }
        }
        res.exit = 0;
        res.ret = "type_ok";
        return res;
    }

    private acc50(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const vATB = this.getAttribute(stack, 5);
        res.type = "type_ok";
        const tipos = vATB.type ? vATB.type.split(/\s+/) : [];
        for (const tipo of tipos) {
            if (tipo !== "integer" && tipo !== "string" && tipo !== "type_error") {
                this.addErrorFromAttr(`READ only accepts integer or string, received ${tipo}`, vATB);
                res.type = "type_error";
                break;
            }
        }
        res.exit = 0;
        res.ret = "type_ok";
        return res;
    }

    private acc51(stack: Attributes[]): Attributes {
         const eTipo = this.getAttribute(stack, 3).type || "unknown";
         const idAtb = this.getAttribute(stack, 7);

         // Get id type from symbol
         const sym = idAtb.symbol;
         let idTipo = "unknown";
         let kind = SymbolKind.UNKNOWN;
         if (sym) {
             kind = sym.kind;
             switch(sym.dataType) {
                 case DataType.INTEGER: idTipo = "integer"; break;
                 case DataType.BOOLEAN: idTipo = "logical"; break;
                 case DataType.STRING: idTipo = "string"; break;
             }
         }

         if (idTipo === eTipo && eTipo !== "type_error") {
             const res = new Attributes();
             res.type = "type_ok";
             res.exit = 0;
             res.ret = "type_ok";
             return res;
         } else {
             // Error logic from Java
             if (eTipo !== "type_error" && idTipo !== "type_error") {
                 if (kind === SymbolKind.FUNCTION && "function" === "function") { // Placeholder logic matching Java
                     this.addErrorFromAttr("Cannot assign a value to a function (or var = func)", idAtb);
                 } // ... detailed error checks can be expanded
                 this.addErrorFromAttr(`${idTipo} is not compatible with ${eTipo}`, idAtb);
             }

             const res = new Attributes();
             res.type = "type_error";
             res.exit = 0;
             res.ret = "type_ok";
             return res;
         }
    }

    private acc52(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const idATB = this.getAttribute(stack, 5);
        const llATB = this.getAttribute(stack, 3);

        const sym = idATB.symbol;
        if (!sym) {
            res.type = "type_error";
            return res;
        }

        if ((llATB.length || 0) > 0 || sym.kind === SymbolKind.PROCEDURE) {
             if (sym.label === "main") {
                 this.addErrorFromAttr("The main program cannot be called", idATB);
                 res.type = "type_error";
             } else {
                 const llAtributos = llATB.type ? llATB.type.split(" ") : [];
                 const params = sym.parameters || [];

                 if (llAtributos.length !== params.length) {
                     this.addErrorFromAttr(`Incorrect number of parameters: expected ${params.length}, received ${llAtributos.length}`, idATB);
                     res.type = "type_error";
                 } else {
                     // Check each parameter type
                     let allMatch = true;
                     const errors: string[] = [];
                     for (let i = 0; i < params.length; i++) {
                         const expectedType = params[i].dataType === DataType.INTEGER ? "integer" :
                                            params[i].dataType === DataType.BOOLEAN ? "logical" :
                                            params[i].dataType === DataType.STRING ? "string" : "desconocido";
                         if (llAtributos[i] !== expectedType && llAtributos[i] !== "type_error") {
                             errors.push(`parameter ${i + 1}: expected ${expectedType}, received ${llAtributos[i]}`);
                             allMatch = false;
                         }
                     }
                     if (!allMatch) {
                         this.addErrorFromAttr(`Incompatible parameter types: ${errors.join("; ")}`, idATB);
                         res.type = "type_error";
                     } else {
                         res.type = "type_ok";
                     }
                 }
             }
        } else {
             if (!sym.parameters || sym.parameters.length === 0) res.type = "type_ok";
             else {
                 this.addErrorFromAttr(`Missing parameters: expected ${sym.parameters.length}, received 0`, idATB);
                 res.type = "type_error";
             }
        }
        res.exit = 0;
        res.ret = "type_ok";
        return res;
    }

    private acc53(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const yATB = this.getAttribute(stack, 3);
        const retToken = this.getAttribute(stack, 5);
        if (yATB.type !== "type_error") res.type = "type_ok";
        else res.type = "type_error";
        res.exit = 0;
        res.ret = yATB.type;
        res.retLine = retToken.line;
        res.retColumn = retToken.column;
        res.retLength = retToken.llength;
        res.retPosition = retToken.position;
        return res;
    }

    private acc54(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const eATB = this.getAttribute(stack, 3);
        const exitKw = this.getAttribute(stack, 7);
        if (eATB.type === "logical") res.type = "type_ok";
        else {
             if (eATB.type !== "type_error") {
                 this.addErrorFromAttr("Exit condition error", exitKw);
             }
             res.type = "type_error";
        }
        res.exit = 1;
        res.ret = "type_ok";
        // Store exit position for later error reporting
        res.exitPosition = exitKw.position;
        res.exitLine = exitKw.line;
        res.exitColumn = exitKw.column;
        res.exitLength = exitKw.llength;
        return res;
    }

    private acc55(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const lATB = this.getAttribute(stack, 3);
        res.type = lATB.type;
        res.length = lATB.length;
        return res;
    }

    private acc56(): Attributes { return this.acc23(); }

    private acc57(stack: Attributes[]): Attributes {
         const res = new Attributes();
         const qATB = this.getAttribute(stack, 1);
         const eATB = this.getAttribute(stack, 3);
         if (!qATB.type || qATB.type === "") res.type = eATB.type;
         else res.type = (eATB.type || "") + " " + qATB.type;
         res.length = 1 + (qATB.length || 0);
         return res;
    }

    private acc58(stack: Attributes[]): Attributes {
        // q1ATB=1, eATB=3
        const res = new Attributes();
        const q1ATB = this.getAttribute(stack, 1);
        const eATB = this.getAttribute(stack, 3);
        if (!q1ATB.type || q1ATB.type === "") res.type = eATB.type;
        else res.type = (eATB.type || "") + " " + q1ATB.type;
        res.length = 1 + (q1ATB.length || 0);
        return res;
    }

    private acc59(): Attributes { return this.acc23(); }

    private acc60(stack: Attributes[]): Attributes {
        // wATB=1, idATB=3
        const res = new Attributes();
        const wATB = this.getAttribute(stack, 1);
        const idATB = this.getAttribute(stack, 3);

        // get type from id
        // In this rule, ID is variable, extract type
        const sym = idATB.symbol;
        let t = "unknown";
        if(sym) {
             t = (sym.dataType === DataType.INTEGER) ? "integer" : "string"; // simplified
        }

        if (!wATB.type || wATB.type === "") res.type = t;
        else res.type = t + " " + wATB.type;
        res.length = 1 + (wATB.length || 0);
        return res;
    }

    private acc61(stack: Attributes[]): Attributes { return this.acc60(stack); }
    private acc62(): Attributes { return this.acc23(); }

    private acc63(stack: Attributes[]): Attributes {
        const e = this.getAttribute(stack, 1);
        const res = new Attributes();
        res.type = e.type;
        return res;
    }

    private acc64(): Attributes {
        const res = new Attributes();
        res.type = "";
        return res;
    }

    private acc65(stack: Attributes[]): Attributes {
        return this.checkBinaryOp(stack, 5, 1, "logical", "logical", "logical");
    }
    private acc66(stack: Attributes[]): Attributes {
        return this.checkBinaryOp(stack, 5, 1, "logical", "logical", "logical");
    }
    private acc67(stack: Attributes[]): Attributes {
        const res = new Attributes();
        res.type = this.getAttribute(stack, 1).type;
        return res;
    }
    private acc68(stack: Attributes[]): Attributes {
        return this.checkBinaryOp(stack, 5, 1, "logical", "logical", "logical");
    }
    private acc69(stack: Attributes[]): Attributes {
        const res = new Attributes();
        res.type = this.getAttribute(stack, 1).type;
        return res;
    }

    // Comparators
    private acc70(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }
    private acc71(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }
    private acc72(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }
    private acc73(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }
    private acc74(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }
    private acc75(stack: Attributes[]): Attributes { return this.checkCompOp(stack); }

    private checkCompOp(stack: Attributes[]): Attributes {
        return this.checkBinaryOp(stack, 5, 1, "integer", "integer", "logical");
    }

    private checkBinaryOp(stack: Attributes[], lhsIdx: number, rhsIdx: number,
                          typeL: string, typeR: string, resultType: string): Attributes {
        const l = this.getAttribute(stack, lhsIdx);
        const r = this.getAttribute(stack, rhsIdx);
        const res = new Attributes();
        if (l.type === typeL && r.type === typeR) {
            res.type = resultType;
        } else {
             // Don't report error if already reported (type_error)
             if (l.type !== "type_error" && r.type !== "type_error") {
                 if (l.type !== typeL && r.type !== typeR) {
                     this.addErrorFromAttr(`Incompatible types: left operand expected ${typeL} but received ${l.type}, right operand expected ${typeR} but received ${r.type}`, l);
                 } else if (l.type !== typeL) {
                     this.addErrorFromAttr(`Incompatible type: left operand expected ${typeL} but received ${l.type}`, l);
                 } else {
                     this.addErrorFromAttr(`Incompatible type: right operand expected ${typeR} but received ${r.type}`, r);
                 }
             }
             res.type = "type_error";
        }
        return res;
    }

    private acc76(stack: Attributes[]): Attributes { return this.acc67(stack); }

    // Arithmetic
    private acc77(stack: Attributes[]): Attributes { // + (can be string or int)
        const i = this.getAttribute(stack, 1);
        const h = this.getAttribute(stack, 5);
        const res = new Attributes();
        if (i.type === h.type && (i.type === "integer" || i.type === "string")) {
            res.type = h.type;
        } else {
            // Don't report error if already reported (type_error)
            if (i.type !== "type_error" && h.type !== "type_error") {
                if (i.type !== h.type) {
                    this.addErrorFromAttr(`Incompatible types for +: left operand ${h.type}, right operand ${i.type}`, h);
                } else if (i.type !== "integer" && i.type !== "string") {
                    this.addErrorFromAttr(`Incompatible type for +: expected integer or string, received ${i.type}`, i);
                }
            }
            res.type = "type_error";
        }
        return res;
    }

    private acc78(stack: Attributes[]): Attributes { // - (int only)
         return this.checkBinaryOp(stack, 5, 1, "integer", "integer", "integer");
    }

    private acc79(stack: Attributes[]): Attributes { return this.acc67(stack); }

    private acc80(stack: Attributes[]): Attributes { return this.checkBinaryOp(stack, 5, 1, "integer", "integer", "integer"); } // OR? Java code says acc80 -> 82 use same logic
    private acc81(stack: Attributes[]): Attributes { return this.checkBinaryOp(stack, 5, 1, "integer", "integer", "integer"); }
    private acc82(stack: Attributes[]): Attributes { return this.checkBinaryOp(stack, 5, 1, "integer", "integer", "integer"); }
    private acc83(stack: Attributes[]): Attributes { return this.acc67(stack); }

    private acc84(stack: Attributes[]): Attributes { return this.checkBinaryOp(stack, 1, 5, "integer", "integer", "integer"); } // negate? Java code checks atb[1] and atb[5]. neg op rule.

    private acc85(stack: Attributes[]): Attributes { return this.acc67(stack); }

    // Unary
    private acc86(stack: Attributes[]): Attributes { // NOT
        const v = this.getAttribute(stack, 1);
        const res = new Attributes();
        if(v.type === "logical") res.type = "logical";
        else {
            if (v.type !== "type_error") {
                this.addErrorFromAttr("Expected logical", v);
            }
            res.type = "type_error";
        }
        return res;
    }

    private acc87(stack: Attributes[]): Attributes { // Unary +
         const v = this.getAttribute(stack, 1);
         const res = new Attributes();
         if(v.type === "integer") res.type = "integer";
         else {
             if (v.type !== "type_error") {
                 this.addErrorFromAttr("Expected integer", v);
             }
             res.type = "type_error";
         }
         return res;
    }

    private acc88(stack: Attributes[]): Attributes { return this.acc87(stack); } // Unary -

    private acc89(stack: Attributes[]): Attributes { return this.acc67(stack); }

    // Constants literals
    private acc90(): Attributes { const r=new Attributes(); r.type="integer"; return r; }
    private acc91(): Attributes { const r=new Attributes(); r.type="string"; return r; }
    private acc92(): Attributes { const r=new Attributes(); r.type="logical"; return r; }
    private acc93(): Attributes { const r=new Attributes(); r.type="logical"; return r; }

    // Call / Access
    private acc94(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const llAtb = this.getAttribute(stack, 1); // args
        const idAtb = this.getAttribute(stack, 3); // id

        const sym = idAtb.symbol;
        if (!sym) { res.type="type_error"; return res; }

        const llAtributos = llAtb.type ? llAtb.type.split(/\s+/) : [];
        const argCount = llAtb.length || 0;

        if (sym.kind === SymbolKind.FUNCTION) {
            const params = sym.parameters || [];
            if (argCount !== params.length) {
                this.addErrorFromAttr(`Incorrect number of arguments: expected ${params.length}, received ${argCount}`, idAtb);
                res.type = "type_error";
            } else {
                let typeError = false;
                for (let i = 0; i < params.length; i++) {
                    const expectedType = params[i].dataType === DataType.INTEGER ? "integer" :
                                       params[i].dataType === DataType.BOOLEAN ? "logical" :
                                       params[i].dataType === DataType.STRING ? "string" : "unknown";
                    if (llAtributos[i] !== expectedType) {
                        this.addErrorFromAttr(`Argument ${i+1} type mismatch: expected ${expectedType}, received ${llAtributos[i]}`, idAtb);
                        typeError = true;
                    }
                }
                if (typeError) {
                    res.type = "type_error";
                } else {
                    res.type = sym.returnType === DataType.INTEGER ? "integer" :
                              sym.returnType === DataType.BOOLEAN ? "logical" : "string";
                }
            }
        } else if (sym.kind === SymbolKind.PROCEDURE) {
            const params = sym.parameters || [];
            if (argCount !== params.length) {
                this.addErrorFromAttr(`Incorrect number of arguments for procedure: expected ${params.length}, received ${argCount}`, idAtb);
            } else if (params.length > 0) {
                for (let i = 0; i < params.length; i++) {
                    const expectedType = params[i].dataType === DataType.INTEGER ? "integer" :
                                       params[i].dataType === DataType.BOOLEAN ? "logical" :
                                       params[i].dataType === DataType.STRING ? "string" : "unknown";
                    if (llAtributos[i] !== expectedType) {
                        this.addErrorFromAttr(`Argument ${i+1} type mismatch for procedure: expected ${expectedType}, received ${llAtributos[i]}`, idAtb);
                    }
                }
            }
            this.addErrorFromAttr("A procedure returns nothing", idAtb);
            res.type = "type_error";
        } else {
            // variable
            if (argCount > 0) {
                this.addErrorFromAttr("Variables do not take arguments", idAtb);
                res.type = "type_error";
            } else {
                res.type = sym.dataType === DataType.INTEGER ? "integer" :
                          sym.dataType === DataType.BOOLEAN ? "logical" : "string";
            }
        }
        return res;
    }

    private acc95(stack: Attributes[]): Attributes {
        const res = new Attributes();
        res.type = this.getAttribute(stack, 3).type;
        return res;
    }

    // Array access / casting checks? "zAtb.getTipo().equals('entero')"
    private acc96(stack: Attributes[]): Attributes {
        const res = new Attributes();
        const zAtb = this.getAttribute(stack, 9);
        if (zAtb.type === "integer") res.type = "logical";
        else {
             if (zAtb.type !== "type_error") {
                 this.addErrorFromAttr("Expected integer for index", zAtb);
             }
             res.type = "type_error";
        }
        return res;
    }

    private acc97(stack: Attributes[]): Attributes {
        const res = new Attributes();
        res.type = "integer";
        return res;
    }
    private acc98(stack: Attributes[]): Attributes {
         const res = new Attributes();
         res.type = "integer";
         return res;
    }

    private acc99(): Attributes {
        const res = new Attributes();
        res.ref = "reference";
        return res;
    }

    private acc100(): Attributes {
        const res = new Attributes();
        res.ref = "value";
        return res;
    }
}
