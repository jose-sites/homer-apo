import {writeFile} from 'node:fs/promises';
import {spriteSvg} from '../src/scene/spriteArt';
import type {CharacterId} from '../shared/types';
for(const id of ['homer','marge','bart','lisa','maggie'] as CharacterId[])await writeFile(`public/sprites/${id}.svg`,spriteSvg(id));
