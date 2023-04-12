import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { Type } from '../../utilities';

import { findFunctionStart, findFunctionEnd, findFunctionBody, findFunctionOwner, getCurrentFunction } from '../../functions';

const FILES: vscode.Uri = vscode.Uri.parse(path.resolve(__dirname, '../../../src/test/files/'));
const BINARY: vscode.Uri = vscode.Uri.joinPath(FILES,'binary.rs');
const BYTES: vscode.Uri = vscode.Uri.joinPath(FILES,'bytes.rs');

suite('Functions Test Suite', () => {

    test('Find function start', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let start = new vscode.Position(20,10);
        editor.selection = new vscode.Selection(start,start);

        let found = findFunctionStart(start);

        // vertify that the found position is correct
        assert.strictEqual(found?.line,17); // line number is zero-indexed
        assert.strictEqual(found?.character,0);
	});

    test('Find function end', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let start = new vscode.Position(17,0);
        editor.selection = new vscode.Selection(start,start);

        let found = findFunctionEnd(start);

        // vertify that the found position is correct
        assert.strictEqual(found?.line,21); // line number is zero-indexed
        assert.strictEqual(found?.character,4);
	});

    test('Find function body', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let initial = new vscode.Position(18,0);
        editor.selection = new vscode.Selection(initial,initial);

        let found = findFunctionBody(initial);

        let start = found?.anchor;
        let end = found?.end;

        // vertify that the found selection is correct
        assert.strictEqual(start?.line,17);
        assert.strictEqual(start?.character,0);
        assert.strictEqual(end?.line,21);
        assert.strictEqual(end?.character,4);
	});

    test('Find function owner for struct impl', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let initial = new vscode.Position(17,0);
        let cursor = new vscode.Selection(initial,initial);
        editor.selection = cursor;

        let owner = findFunctionOwner(cursor);

        // vertify that the found owner is correct
        assert.strictEqual(owner?.name,'Binary');
        assert.strictEqual(owner?.type,Type.StructImpl);
	});

    test('Find function owner for trait impl', async () => {
        const document = await vscode.workspace.openTextDocument(BYTES);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let initial = new vscode.Position(121,0);
        let cursor = new vscode.Selection(initial,initial);
        editor.selection = cursor;

        let owner = findFunctionOwner(cursor);

        // vertify that the found owner is correct
        assert.strictEqual(owner?.name,'FromBytes');
        assert.strictEqual(owner?.type,Type.TraitImpl);
	});

    test('Find function in struct impl', async () => {
        const document = await vscode.workspace.openTextDocument(BINARY);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let initial = new vscode.Position(20,0);
        editor.selection = new vscode.Selection(initial,initial);

        let func = await getCurrentFunction();

        // vertify that the found function is correct
        assert(func);
        assert.strictEqual(func?.body.anchor.line,17);
        assert.strictEqual(func?.body.end.line,21);
        assert.strictEqual(func?.body.end.character,4);
        assert.strictEqual(func?.owner.name,'Binary');
        assert.strictEqual(func?.owner.type,Type.StructImpl);
	});

    test('Find function in trait impl', async () => {
        const document = await vscode.workspace.openTextDocument(BYTES);
        const editor = await vscode.window.showTextDocument(document);

        // put the cursor inside of a new function
        let initial = new vscode.Position(116,0);
        editor.selection = new vscode.Selection(initial,initial);

        let func = await getCurrentFunction();

        // vertify that the found function is correct
        assert(func);
        assert.strictEqual(func?.body.anchor.line,115);
        assert.strictEqual(func?.body.end.line,117);
        assert.strictEqual(func?.body.end.character,4);
        assert.strictEqual(func?.owner.name,'IntoBytes');
        assert.strictEqual(func?.owner.type,Type.TraitImpl);
	});

});
