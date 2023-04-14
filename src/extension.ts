import * as vscode from 'vscode';

import { getCurrentFunction } from './functions';
import { getCurrentStruct } from './structs';
import { generateFunctionComment, insertComment, generateStructComment, generateTraitComment } from './generate';
import { cleanComment, getIndent, getCurrentScope, Type } from './utilities';
import { getCurrentTrait } from './traits';

async function generateTraitDoc(){
    const target = await getCurrentTrait();
    const declaration = target?.declaration();

    if(!target){ return; }
    if(!declaration){ return; }

    const indent = getIndent(declaration);
    const comment = await generateTraitComment(target);

    if(!comment){ return; }

    const cleaned = cleanComment(indent,comment);
    await insertComment(target.body.anchor.line,cleaned);
}

async function generateStructDoc(){
    const target = await getCurrentStruct();
    const declaration = target?.declaration();

    if(!target){ return; }
    if(!declaration){ return; }

    const indent = getIndent(declaration);
    const comment = await generateStructComment(target);

    if(!comment){ return; }

    const cleaned = cleanComment(indent,comment);
    await insertComment(target.body.anchor.line,cleaned);
}

async function generateFunctionDoc(){
    const target = await getCurrentFunction();
    const declaration = target?.declaration();

    if(!target){ return; }
    if(!declaration){ return; }

    const indent = getIndent(declaration);
    const comment = await generateFunctionComment(target);

    if(!comment){ return; }

    const cleaned = cleanComment(indent,comment);
    await insertComment(target.body.anchor.line,cleaned);
}

async function generateDocComment(){
    switch(await getCurrentScope()){
        case Type.Trait: 
            await generateTraitDoc();
            break;
        case Type.Struct: 
            await generateStructDoc();
            break;
        case Type.Function: 
            await generateFunctionDoc();
            break;
    }
}

async function generateUnitTests(){
    
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand(
        'rustai.generateDocComment', 
        generateDocComment));

    context.subscriptions.push(vscode.commands.registerCommand(
        'rustai.generateUnitTests', 
        generateUnitTests));

}

// This method is called when your extension is deactivated
export function deactivate() {


}
