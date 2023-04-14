import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { findObjectBody, findObjectEnd, findObjectStart } from './common';

export class Owner {
    name: string;
    type: Type;

    constructor(
        type: Type,
        name: string,
    ) {
        this.type = type;
        this.name = name;
    }
}

export class Function {

    // the name of the function
    name: string;

    // the body of the function
    body: vscode.Selection;

    // the owning object (struct or trait)
    owner: Owner;

    constructor(
        name: string,
        body: vscode.Selection,
        owner: Owner
    ) {
        this.name = name;
        this.body = body;
        this.owner = owner;
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

export function findFunctionOwner(functionBody: vscode.Selection): Owner | null {

    const editor = vscode.window.activeTextEditor;
    const initial = functionBody.anchor;
    let current = new vscode.Position(initial.line,0);

    if(!editor){
        return null;
    }

    let line = getBody(editor,current);

    // if this isn't the start of a function, exit
    if(getType(line) != Type.Function){
        return null;
    }

    // convenience function to count patterns in a string
    function count(line: string, pattern: RegExp): number {
        return (line.match(pattern)||[]).length;
    }

    try {

        let depth = 1;

        do {
            // jump to the previous line
            current = current.with({ line: current.line - 1 });

            // get the text of the line
            line = getBody(editor,current);

            // ignore comments
            line = removeComments(line);

            // get open and closing braces
            let open = count(line,/{/g);
            let close = count(line,/}/g);

            // update the depth
            depth += close - open;
        }
        while(depth > 0);

        let type = getType(line);
        let name = getObject(line,type);

        // don't care about function or unknown scopes
        if(type == Type.Function || type == Type.Unknown) {
            return null;
        }

        if(!name){
            return null;
        }

        return new Owner(type,name);
    }
    catch(e){
        console.log(e);
        return null;
    }
}

export async function findFunctionStart(currentPosition: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectStart(currentPosition,Type.Function);
}

export async function findFunctionEnd(functionStart: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectEnd(functionStart,Type.Function);
}

export async function findFunctionBody(currentPosition: vscode.Position): Promise<vscode.Selection | null> {
    return await findObjectBody(currentPosition,Type.Function);
}

export async function getCurrentFunction(): Promise<Function | null> {
    const editor = vscode.window.activeTextEditor;
    let selection = editor?.selection;
    let initial = selection?.active;

    if(!editor){
        return null;
    }

    if(!initial){
        return null;
    }

    let body = await findFunctionBody(initial);
    
    if(!body){
        return null;
    }

    let owner = findFunctionOwner(body);

    if(!owner){
        return null;
    }

    let start = body.anchor;
    let line = getBody(editor,start);
    let name = getObject(line,Type.Function);

    if(!name){
        return null;
    }

    return new Function(name,body,owner);
}