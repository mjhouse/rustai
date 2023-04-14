import * as vscode from 'vscode';

import { insertComment, generateComment } from './generate';
import { cleanComment, getBody } from './utilities';
import { Structure, getHierarchy } from './common';

async function generateObjectComment(structure: Structure[]) {
    const editor = vscode.window.activeTextEditor;
    let target = structure[0];

    if(!target || !editor){
        return;
    }

    // get the declaration of the target
    let body = getBody(editor,target.line);

    // get the parent of the target
    let owner = structure[target.owner] || null;

    const comment = await generateComment(target,owner,body);

    if(!comment){ return; }

    const cleaned = cleanComment(target.indent,comment);
    await insertComment(target.line.line,cleaned);
}

async function generateDocComment(){
    let structures = await getHierarchy();
    await generateObjectComment(structures);
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
