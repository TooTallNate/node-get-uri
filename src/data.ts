import createDebug from 'debug';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { UrlWithStringQuery } from 'url';
import dataUriToBuffer from 'data-uri-to-buffer';
import { GetUriOptions } from '.';
import NotModifiedError from './notmodified';

const debug = createDebug('get-uri:data');

class DataReadable extends Readable {
	public hash?: string;

	constructor(hash: string, buf: Buffer) {
		super();
		this.push(buf);
		this.push(null);
		this.hash = hash;
	}
}

interface DataOptions extends GetUriOptions {
	cache?: DataReadable;
}

/**
 * Returns a Readable stream from a "data:" URI.
 */
export default async function get(
	{ href: uri }: UrlWithStringQuery,
	{ cache }: DataOptions
): Promise<Readable> {
	// need to create a SHA1 hash of the URI string, for cacheability checks
	// in future `getUri()` calls with the same data URI passed in.
	let shasum = createHash('sha1');
	shasum.update(uri);
	let hash = shasum.digest('hex');
	debug('generated SHA1 hash for "data:" URI: %o', hash);

	// check if the cache is the same "data:" URI that was previously passed in.
	if (cache && cache.hash == hash) {
		debug('got matching cache SHA1 hash: %o', hash);
		throw new NotModifiedError();
	} else {
		debug('creating Readable stream from "data:" URI buffer');
		const buf = dataUriToBuffer(uri);
		return new DataReadable(hash, buf);
	}
}