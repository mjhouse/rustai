import * as vscode from 'vscode';
import { Configuration, OpenAIApi } from "openai";
import { Function } from "./functions";
import { Type, removeComments } from './utilities';
import { Struct } from './structs';
import { Trait } from './traits';
import { Structure } from './common';

const DEFAULT_MODEL: string = 'text-davinci-002';
const DEFAULT_TEMP: number = 0.25;
const DEFAULT_TOKENS: number = 2000;

const TRAIT_COMMENT = (body: string) => {
    return `
        Write a Rust doc comment for the following trait:
        "${body}"

        The Rust doc comment should be written in markdown using three slashes on each line (like '///'), 
        contain a brief description of what the trait does based on the properties in the trait body,
        and a minimal example to demonstrate how to use the trait. The example should assume that there 
        is an object called "MyStruct" that implements the trait and has a 'new' function used to create 
        the "MyStruct" object.
    `
}

const STRUCT_COMMENT = (body: string) => {
    return `
        Write a Rust doc comment for the following struct:
        "${body}"

        The Rust doc comment should be written in markdown using three slashes on each line (like '///'), 
        contain a brief description of what the struct does based on the properties in the struct body,
        and a minimal example to demonstrate how to create an instance of the struct. The example should
        assume that there is a 'new' function that can be used to create the object.
    `
}

const METHOD_COMMENT = (text: string, name: string) => {
    return `
        Write a doc comment for the following method on the ${name} object:
        "${text}"

        The doc comment should be written in markdown using three slashes on each line (like '///'), 
        contain a brief description of what the function does, list the arguments to the function,
        the return value, and a minimal example of how to use the function without any 'using' statements or 
        namespaces. Do not include any explanation or other non-commented code.
    `
}

const FUNCTION_COMMENT = (text: string) => {
    return `
        Write a doc comment for the following function:
        "${text}"

        The doc comment should be written in markdown using three slashes on each line (like '///'), 
        contain a brief description of what the function does, list the arguments to the function,
        the return value, and a minimal example of how to use the function without any 'using' statements or 
        namespaces. Do not include any explanation or other non-commented code.
    `
}

async function generate(prompt: string): Promise<string | null> {
    // get the extension configuration and api key
    const config = vscode.workspace.getConfiguration('rustai');
    const api_key: string = config.get('openAiApiKey','');

    // get other configuration values
    const model: string = config.get('openAiModel',DEFAULT_MODEL);
    const temp: number = config.get('openAiTemperature',DEFAULT_TEMP);
    const tokens: number = config.get('openAiMaxTokens',DEFAULT_TOKENS);

    // check that the key exists
    if(!api_key){
        return null;
    }

    // build an open ai client with the key
    const openai = new OpenAIApi(new Configuration({
        apiKey: api_key,
    }));

    // fetch a response from the api
	const response = await openai.createCompletion({
		model: model,
		prompt: prompt,
		temperature: temp,
		max_tokens: tokens,
	});

    // get the generated responses 
    let result = response.data?.choices;

    if(result){
        return result[0].text?.trim() || null;
    }
    else {
        return null;
    }
}

export async function generateComment(target: Structure, owner: Structure | null, body: string): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    let prompt = null;

    switch(target.type){
        case Type.Function:
            if(owner){
                prompt = METHOD_COMMENT(body,owner.name);
            } else {
                prompt = FUNCTION_COMMENT(body);
            }
            break;
        case Type.Struct:
            prompt = STRUCT_COMMENT(body);
            break;
        case Type.Trait:
            prompt = TRAIT_COMMENT(body);
            break;
    }

    return prompt ? generate(prompt) : null;
}

export async function insertComment(position: number, comment: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if(!editor){ return; }

    // declare the previous position, line text and remove list
    let current = new vscode.Position(position - 1,0);
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
    let insert_line = position - remove.length;
    let insert_pos = new vscode.Position(insert_line,0);

    // insert the comment as a snippet for user acceptance
    let result = new vscode.SnippetString(comment);
    editor.insertSnippet(result,insert_pos);
}