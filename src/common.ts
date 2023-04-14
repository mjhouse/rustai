import * as vscode from 'vscode';
import { getType, Type, getBody, countMatch, lastCharacter, getObject } from './utilities';

export function findObjectStart(currentPosition: vscode.Position, objectType: Type): vscode.Position | null {
    const editor = vscode.window.activeTextEditor;
    let current = new vscode.Position(currentPosition.line,0);

    if(!editor){
        return null;
    }

    try {
        while(true){
            let line = getBody(editor,current);
            let type = getType(line);

            if(type == objectType){
                return current;
            }
            else if(type == Type.Unknown){
                current = current.translate({lineDelta: -1})
            }
            else {
                return null;
            }
        }
    }
    catch(e){
        console.log(e);
        return null;
    }
}

export function findObjectEnd(functionStart: vscode.Position, objectType: Type): vscode.Position | null {
    const editor = vscode.window.activeTextEditor;
    let current = new vscode.Position(functionStart.line,0);

    if(!editor){
        return null;
    }

    let line = getBody(editor,current);

    // if this isn't the start of a function, exit
    if(getType(line) != objectType){
        return null;
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
            let open = countMatch(line,/{/g);
            let close = countMatch(line,/}/g);

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
            character: lastCharacter(current) 
        });
    }
    catch(e){
        console.log(e);
        return null;
    }
}

export function findObjectBody(currentPosition: vscode.Position, objectType: Type): vscode.Selection | null {

    let start = findObjectStart(currentPosition,objectType);

    if(!start) {
        return null;
    }

    let end = findObjectEnd(start,objectType);

    if(!end){
        return null;
    }

    return new vscode.Selection(start,end);
}

export async function getCurrentObject<T>(instance: { new(b: vscode.Selection, n: string): T ;}, objectType: Type): Promise<T | null> {
    const editor = vscode.window.activeTextEditor;
    let selection = editor?.selection;
    let initial = selection?.active;

    if(!editor){
        return null;
    }

    if(!initial){
        return null;
    }

    let body = findObjectBody(initial,objectType);
    
    if(!body){
        return null;
    }

    let start = body.anchor;
    let line = getBody(editor,start);
    let name = getObject(line,objectType);

    if(!name){
        return null;
    }

    return new instance(body,name);
}