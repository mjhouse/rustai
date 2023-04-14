import * as vscode from 'vscode';
import { getType, Type, getBody, countMatch, lastCharacter, getObject, getIndent, removeComments } from './utilities';

export class Documentable {

    // the name of the object
    name: string;

    // the body of the object
    body: vscode.Selection;

    // the indention of the object
    indent: string;

    constructor(
        name: string,
        body: vscode.Selection,
        indent: string,
    ) {
        this.name = name;
        this.body = body;
        this.indent = indent;
    }

};

export async function findObjectStart(currentPosition: vscode.Position, objectType: Type): Promise<vscode.Position | null> {
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

export async function findObjectEnd(functionStart: vscode.Position, objectType: Type): Promise<vscode.Position | null> {
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

export async function findObjectBody(currentPosition: vscode.Position, objectType: Type): Promise<vscode.Selection | null> {

    let start = await findObjectStart(currentPosition,objectType);

    if(!start) {
        return null;
    }

    let end = await findObjectEnd(start,objectType);

    if(!end){
        return null;
    }

    return new vscode.Selection(start,end);
}

export async function getCurrentObject<T extends Documentable>(objectType: Type): Promise<T | null> {
    const editor = vscode.window.activeTextEditor;
    let selection = editor?.selection;
    let initial = selection?.active;

    if(!editor){
        return null;
    }

    if(!initial){
        return null;
    }

    let body = await findObjectBody(initial,objectType);
    
    if(!body){
        return null;
    }

    let start = body.anchor;
    let line = getBody(editor,start);
    let name = getObject(line,objectType);

    if(!name){
        return null;
    }

    let indent = getIndent(line);

    let block = new Documentable(name,body,indent);
    return block as T;
}

export class Structure {
    type: Type;
    name: string;
    depth: number;
    owner: number;
    line: vscode.Position;
    indent: string;

    constructor(
        type: Type,
        name: string,
        depth: number,
        line: vscode.Position,
        indent: string,
    ) {
        this.type = type;
        this.name = name;
        this.depth = depth;
        this.owner = -1;
        this.line = new vscode.Position(line.line,0);
        this.indent = indent;
    }
}

export async function getHierarchy(): Promise<Structure[]> {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    const initial = selection?.active;

    if(!editor || !initial){
        return [];
    }

    // type, name, depth, and contained
    let result: Structure[] = [];

    let text = "";
    let name = "";
    let type = Type.Unknown;
    let line = new vscode.Position(initial.line,0);

    let depth: number = 0;

    // iterate until the top of the file
    while(line.line != 0) {

        // get the text, type and name
        text = getBody(editor,line);
        text = removeComments(text);
        type = getType(text);
        name = getObject(text,type) || '';

        // get open and closing braces
        let open = countMatch(text,/{/g);
        let close = countMatch(text,/}/g);

        // update the depth
        depth = depth + (close - open);

        // cache type and name if found
        if(name){

            // update previous elements
            for(let i = result.length - 1; i >= 0 && result[i].depth > depth; --i){
                result[i].owner = result.length;
            }

            let indent = getIndent(text);

            // save current element with depth
            result.push(new Structure(
                type,name,depth,line,indent
            ));
        }

        // move up by one line
        line = line.translate({ lineDelta: -1 });
    };

    return result;
}