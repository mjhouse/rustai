import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments } from './utilities';

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

    // the body of the function
    body: vscode.Selection;

    // the owning object (struct or trait)
    owner: Owner;

    constructor(
        body: vscode.Selection,
        owner: Owner
    ) {
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

function getBody(editor: vscode.TextEditor, position: vscode.Position): string {
    return editor.document.lineAt(position).text;
}

export function findFunctionStart(currentPosition: vscode.Position): vscode.Position | null {
    const editor = vscode.window.activeTextEditor;
    let current = new vscode.Position(currentPosition.line,0);

    if(!editor){
        return null;
    }

    try {
        while(true){
            let line = getBody(editor,current);
            let type = getType(line);

            switch(type){
                case Type.Function:
                    return current;
                case Type.Unknown:
                    current = current.translate({lineDelta: -1})
                    break;
                default:
                    return null;
            }
        }
    }
    catch(e){
        console.log(e);
        return null;
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

export function findFunctionEnd(functionStart: vscode.Position): vscode.Position | null {

    const editor = vscode.window.activeTextEditor;
    let current = new vscode.Position(functionStart.line,0);

    if(!editor){
        return null;
    }

    let line = getBody(editor,current);

    // if this isn't the start of a function, exit
    if(getType(line) != Type.Function){
        return null;
    }

    // convenience function to get last character position
    function last(position: vscode.Position): number {
        let line = editor?.document.lineAt(position);
        return Math.max((line?.text.length || 1) -1, 0);
    }

    // convenience function to count patterns in a string
    function count(line: string, pattern: RegExp): number {
        return (line.match(pattern)||[]).length;
    }

    try {

        let depth = 0;
        let start = true;

        // set position back a line so that it advances inside the loop
        current = current.with({ line: current.line - 1 })

        do {
            // advance to the next line to be processed
            current = current.with({ line: current.line + 1 });

            // get the text of the line
            line = getBody(editor,current);

            // get open and closing braces
            let open = count(line,/{/g);
            let close = count(line,/}/g);

            // update the depth
            depth += open - close;

            // advance until the first brace
            if(open > 0 && start) {
                start = false;
            }
        }
        while(start || depth > 0);

        // advance to the end of the line and return
        return current.with({ 
            character: last(current) 
        });
    }
    catch(e){
        console.log(e);
        return null;
    }
}

export function findFunctionBody(currentPosition: vscode.Position): vscode.Selection | null {

    let start = findFunctionStart(currentPosition);

    if(!start) {
        return null;
    }

    let end = findFunctionEnd(start);

    if(!end){
        return null;
    }

    return new vscode.Selection(start,end);
}

export async function getCurrentFunction(): Promise<Function | null> {
    const editor = vscode.window.activeTextEditor;
    let selection = editor?.selection;
    let initial = selection?.active;

    if(!initial){
        return null;
    }

    let body = findFunctionBody(initial);
    
    if(!body){
        return null;
    }

    let owner = findFunctionOwner(body);

    if(!owner){
        return null;
    }

    return new Function(body,owner);
}