import * as vscode from 'vscode';
import { getType, getObject, Type, removeComments, getBody, lastCharacter, countMatch } from './utilities';
import { Documentable, findObjectBody, findObjectEnd, findObjectStart, getCurrentObject } from './common';

export class Trait extends Documentable {}

export async function findTraitStart(currentPosition: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectStart(currentPosition,Type.Trait);
}

export async function findTraitEnd(traitStart: vscode.Position): Promise<vscode.Position | null> {
    return await findObjectEnd(traitStart,Type.Trait)
}

export async function findTraitBody(currentPosition: vscode.Position): Promise<vscode.Selection | null> {
    return await findObjectBody(currentPosition,Type.Trait);
}

export async function getCurrentTrait(): Promise<Trait | null> {
    return await getCurrentObject(Type.Trait);
}