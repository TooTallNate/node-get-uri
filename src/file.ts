import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import createDebug from 'debug';
import { Stats, createReadStream } from 'fs';
import { fstat, open } from 'fs-extra';
import uri2path from 'file-uri-to-path';
import { GetUriOptions } from '.';
import NotFoundError from './notfound';
import NotModifiedError from './notmodified';

const debug = createDebug('get-uri:file');

type ReadStreamOptions = Exclude<
	Parameters<typeof createReadStream>[1],
	string
>;

interface FileReadable extends Readable {
	stat?: Stats;
}

type FileOptions = GetUriOptions &
	ReadStreamOptions & {
		cache?: FileReadable;
	};

/**
 * Returns a `fs.ReadStream` instance from a "file:" URI.
 */

export default async function get(
	{ href: uri }: UrlWithStringQuery,
	opts: FileOptions
): Promise<Readable> {
	const {
		cache,
		flags = 'r',
		mode = 438 // =0666
	} = opts;

	try {
		// Convert URI → Path
		const filepath = uri2path(uri);
		debug('Normalized pathname: %o', filepath);

		// `open()` first to get a file descriptor and ensure that the file
		// exists.
		const fd = await open(filepath, flags, mode);

		// Now `fstat()` to check the `mtime` and store the stat object for
		// the cache.
		const stat = await fstat(fd);

		// if a `cache` was provided, check if the file has not been modified
		if (cache && cache.stat && stat && isNotModified(cache.stat, stat)) {
			throw new NotModifiedError();
		}

		// `fs.ReadStream` takes care of calling `fs.close()` on the
		// fd after it's done reading
		// @ts-ignore - `@types/node` doesn't allow `null` as file path :/
		const rs = createReadStream(null, {
			autoClose: true,
			...opts,
			fd
		}) as FileReadable;
		rs.stat = stat;
		return rs;
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			throw new NotFoundError();
		}
		throw err;
	}
}

// returns `true` if the `mtime` of the 2 stat objects are equal
function isNotModified(prev: Stats, curr: Stats): boolean {
	return +prev.mtime === +curr.mtime;
}
