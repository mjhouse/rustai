import * as vscode from 'vscode';

export enum ObjectType {
    Trait,
    Struct
}

export enum Type {
    Unknown = 'Unknown',
    Macro = 'Macro',
    Trait = 'Trait',
    Struct = 'Struct',
    Function = 'Function',
    TraitImpl = 'TraitImpl',
    StructImpl = 'StructImpl'
}

export function takeWhile<Item>(array: Item[], predicate: (v: Item) => boolean): Item[] {
    let result: Item[] = [];
    for(let i = 0; i < array.length; ++i){
        let item = array[i];
        if(!predicate(item)){break};
        result.push(item);
    }
    return result;
}

export function getIndent(value: string): string {
    return takeWhile(
        value.split(''), 
        (s) => /\s+/.test(s)
    ).join('')
}

export function isMacro(text: string): boolean {
    return /(^|\s+)macro_rules!\s+/.test(text);
}

export function isTrait(text: string): boolean {
    return /(^|\s+)trait\s+/.test(text);
}

export function isStruct(text: string): boolean {
    return /(^|\s+)struct\s+/.test(text);
}

export function isFunction(text: string): boolean {
    return /(^|\s+)fn\s+/.test(text);
}

export function isTraitImpl(text: string): boolean {
    return /(^|\s+)impl.+for/.test(text);
}

export function isStructImpl(text: string): boolean {
    return /(^|\s+)impl(?!(.+for)).+/.test(text);
}

function getMatch(text: string, regex: RegExp): string | null {
    return text.match(regex)?.at(1) || null;
}

export function getMacro(text: string): string | null {
    return getMatch(text,/macro_rules!\s+(\w+)/);    
}

export function getTrait(text: string): string | null {
    return getMatch(text,/(?:pub\s)?trait\s(\w+)/);    
}

export function getStruct(text: string): string | null {
    return getMatch(text,/(?:pub\s)?struct\s(\w+)/);
}

export function getFunction(text: string): string | null {
    return getMatch(text,/(?:pub\s)?fn\s(\w+)/);
}

export function getTraitImpl(text: string): string | null {
    return getMatch(text,/(?<=impl(?:<[^>]*>)?\s)(\w+).+for/);
}

export function getStructImpl(text: string): string | null {
    return getMatch(text,/(?<=impl(?:<[^>]*>)?\s)(\w+)(?!(.+for))/);
}

export function getType(text: string): Type {
    if(isStructImpl(text)) {return Type.StructImpl;}
    if(isTraitImpl(text)) {return Type.TraitImpl;}
    if(isFunction(text)) {return Type.Function;}
    if(isStruct(text)) {return Type.Struct;}
    if(isTrait(text)) {return Type.Trait;}
    if(isMacro(text)) {return Type.Macro;}
    return Type.Unknown;
}

export function getObject(text: string, type: Type): string | null {
    switch(type){
        case Type.StructImpl: return getStructImpl(text);
        case Type.TraitImpl: return getTraitImpl(text);
        case Type.Function: return getFunction(text);
        case Type.Struct: return getStruct(text);
        case Type.Trait: return getTrait(text);
        case Type.Macro: return getMacro(text);
        default: return null;
    }
}

export async function getCurrentScope(): Promise<Type> {
    const editor = vscode.window.activeTextEditor;
    const position = editor?.selection?.active;

    let type = Type.Unknown;

    if(!editor){
        return type;
    }

    if(!position){
        return type;
    }

    let current = new vscode.Position(position.line,0);

    try {
        while(type == Type.Unknown && current.line >= 0){
            type = getType(editor.document.lineAt(current).text);
            current = new vscode.Position(current.line - 1, 0);
        }
    }
    catch(e){
        console.log(e);
    }

    return type;
}

export function cleanComment(indent: string, text: string): string {
    let lines = text
        .split('///')
        .map(line => line.trim());

    if(lines.length == 0){
        return '';
    }

    while(!lines[0]){
        lines.splice(0,1);
    }

    let result = lines
        .map(line => `${indent}/// ${line}`)
        .join('\n');
    
    if(!result.endsWith('\n')){
        result += '\n';
    }

    return result;
}

export function removeComments(line: string): string {
    line = line.replace(/\/\/.*$/,'');
    line = line.replace(/\/\*.*?\*\//,'');
    return line;
}

export function countMatch(line: string, pattern: RegExp): number {
    return (line.match(pattern)||[]).length;
}

export function lastCharacter(position: vscode.Position): number {
    const editor = vscode.window.activeTextEditor;
    let line = editor?.document.lineAt(position);
    return Math.max(line?.text.length || 0, 0);
}

export function getBody(editor: vscode.TextEditor, position: vscode.Position): string {
    return editor.document.lineAt(position).text;
}