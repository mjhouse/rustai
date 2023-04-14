import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { findObjectBody, findObjectEnd, findObjectStart, getCurrentObject } from './common';

export class Trait {
    
    // the name of the trait
    name: string;

    // the body of the trait
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

export function findTraitStart(currentPosition: vscode.Position): vscode.Position | null {
    return findObjectStart(currentPosition,Type.Trait);
}

export function findTraitEnd(traitStart: vscode.Position): vscode.Position | null {
    return findObjectEnd(traitStart,Type.Trait)
}

export function findTraitBody(currentPosition: vscode.Position): vscode.Selection | null {
    return findObjectBody(currentPosition,Type.Trait);
}

export async function getCurrentTrait(): Promise<Trait | null> {
    return await getCurrentObject(Trait,Type.Trait);
}