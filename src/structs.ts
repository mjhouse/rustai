import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { Documentable, findObjectBody, findObjectEnd, findObjectStart, getCurrentObject } from './common';

export class Struct extends Documentable {}

export async function findStructStart(currentPosition: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectStart(currentPosition,Type.Struct);
}

export async function findStructEnd(structStart: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectEnd(structStart,Type.Struct);
}

export async function findStructBody(currentPosition: vscode.Position): Promise<vscode.Selection | null> {
    return await findObjectBody(currentPosition,Type.Struct);
}

export async function getCurrentStruct(): Promise<Struct | null> {
    return await getCurrentObject(Type.Struct);
}