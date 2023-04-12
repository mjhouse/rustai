import * as vscode from 'vscode';
import { getCurrentFunction } from './functions';
import { generateFunctionComment, insertFunctionComment } from './generate';
import { cleanComment, getIndent } from './utilities';

async function generateDocComment(){
    const target = await getCurrentFunction();
    const declaration = target?.declaration();

    if(!target){ return; }
    if(!declaration){ return; }

    const indent = getIndent(declaration);
    const comment = await generateFunctionComment(target);

    if(!comment){ return; }

    const cleaned = cleanComment(indent,comment);
    await insertFunctionComment(target,cleaned);
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
