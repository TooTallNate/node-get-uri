import { pathToFileURL } from 'url';
import { readFile } from 'fs-extra';
import { getUri } from '../src';
import { toBuffer } from './util';

describe('get-uri', () => {
	describe('"file:" protocol', () => {
		it('should work for local files', async () => {
			const actual = await readFile(__filename, 'utf8');
			const uri = pathToFileURL(__filename);
			const stream = await getUri(uri.href);
			const buf = await toBuffer(stream);
			expect(buf.toString()).toEqual(actual);
		});

		it('should return ENOTFOUND for bad filenames', async () => {
			const uri = pathToFileURL(`${__filename}does-not-exist`);
			await expect(getUri(uri.href)).rejects.toHaveProperty(
				'code',
				'ENOTFOUND'
			);
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', async () => {
			const uri = pathToFileURL(__filename);
			const cache = await getUri(uri.href);
			await expect(getUri(uri.href, { cache })).rejects.toHaveProperty(
				'code',
				'ENOTMODIFIED'
			);
		});
	});
});
