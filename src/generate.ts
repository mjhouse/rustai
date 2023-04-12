import * as vscode from 'vscode';
import { Configuration, OpenAIApi } from "openai";
import { Function } from "./functions";
import { removeComments, lastCharacter } from './utilities';

let OPENAI_API_KEY: string = '<PUT YOUR API KEY HERE>';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const METHOD_COMMENT = (text: string, name: string) => {
    return `
        Write a doc comment for the following function:
        "${text}"

        The doc comment should be written in markdown using three slashes on each line (like '///'), 
        contain a brief description of what the function does, list the arguments to the function,
        the return value, and a minimal example of how to use the function without any 'using' statements or 
        namespaces. Do not include 
        any explanation or other non-commented code. If the function is indented or contains a 'self'
        parameter, assume it is a method on the object "${name}".
    `
}

async function generate(prompt: string): Promise<string | null> {
	const response = await openai.createCompletion({
		model: "text-davinci-002",
		prompt: prompt,
		temperature: 0.25,
		max_tokens: 2000,
	});
    let result = response.data?.choices;

    if(result){
        return result[0].text?.trim() || null;
    }
    else {
        return null;
    }
}

export async function generateFunctionComment(target: Function): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    const text = editor?.document.getText(target.body);

    if(!text){
        return null;
    }

    const prompt = METHOD_COMMENT(text,target.owner.name);
    const result = generate(prompt);

    return result;
}

export async function insertFunctionComment(target: Function, comment: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if(!editor){ return; }

    // declare the previous position, line text and remove list
    let current = new vscode.Position(target.body.anchor.line - 1,0);
    let line = editor.document.lineAt(current).text;
    let remove: vscode.Selection[] = [];

    while(true){
        // get the current line
        line = editor.document.lineAt(current).text.trim();

        // stop deleting if the line is blank
        if(!line) { break; }

        // remove all comments from the line
        line = removeComments(line).trim();

        // stop deleting if the line has code
        if(line) { break; }

        // get the start and end of the line
        let start = new vscode.Position(current.line,0);
        let end = new vscode.Position(current.line + 1,0);

        // add to the lines to remove
        remove.push(new vscode.Selection(start,end));
        current = current.translate({ lineDelta: -1 });
    }

    // remove all the leading comment lines above the function
    await editor.edit((builder) => {
        for(let i = 0; i < remove.length; ++i){
            builder.delete(remove[i]);
        }
    });

    // adjust the insertion point to account for removed comments
    let insert_line = target.body.anchor.line - remove.length;
    let insert_pos = new vscode.Position(insert_line,0);

    // insert the comment as a snippet for user acceptance
    let result = new vscode.SnippetString(comment);
    editor.insertSnippet(result,insert_pos);
}