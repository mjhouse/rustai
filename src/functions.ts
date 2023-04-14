import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { Documentable, findObjectBody, findObjectEnd, findObjectStart, getCurrentObject } from './common';

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

export class Function extends Documentable {

    // the owning object
    owner: Owner | null;

    constructor(
        name: string,
        body: vscode.Selection,
        indent: string,
        owner: Owner | null
    ) {
        super(name,body,indent);
        this.owner = owner;
    }

}

export async function findFunctionOwner(functionBody: vscode.Selection): Promise<Owner | null> {

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
    let result = await getCurrentObject(Type.Function) as Function;
    result.owner = await findFunctionOwner(result?.body);
    return result;
}