import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { findObjectBody, findObjectEnd, findObjectStart, getCurrentObject } from './common';

export class Struct {
    
    // the name of the struct
    name: string;

    // the body of the struct
    body: vscode.Selection;

    constructor(
        body: vscode.Selection,
        name: string
    ) {
        this.body = body;
        this.name = name;
    }

    content(): string | null {
        const editor = vscode.window.activeTextEditor;
        return editor?.document.getText(this.body) || null;
    }

    declaration(){
        const editor = vscode.window.activeTextEditor;
        return editor?.document.lineAt(this.body.anchor).text || null;
    }
}

export function findStructStart(currentPosition: vscode.Position): vscode.Position | null {
    return findObjectStart(currentPosition,Type.Struct);
}

export function findStructEnd(structStart: vscode.Position): vscode.Position | null {
    return findObjectEnd(structStart,Type.Struct);
}

export function findStructBody(currentPosition: vscode.Position): vscode.Selection | null {
    return findObjectBody(currentPosition,Type.Struct);
}

export async function getCurrentStruct(): Promise<Struct | null> {
    return await getCurrentObject(Struct,Type.Struct);
}