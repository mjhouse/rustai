import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { getHierarchy } from '../../common';

const FILES: vscode.Uri = vscode.Uri.parse(path.resolve(__dirname, '../../../src/test/files/'));
const BINARY: vscode.Uri = vscode.Uri.joinPath(FILES,'binary.rs');
const BYTES: vscode.Uri = vscode.Uri.joinPath(FILES,'bytes.rs');

suite('Common Test Suite', () => {

    test('Find hierarchy', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let start = new vscode.Position(29,0);
        editor.selection = new vscode.Selection(start,start);

        let hierarchy = await getHierarchy();
        console.log(hierarchy);

        // // vertify that the found position is correct
        // assert.strictEqual(found?.line,20); // line number is zero-indexed
        // assert.strictEqual(found?.character,0);
	});

});