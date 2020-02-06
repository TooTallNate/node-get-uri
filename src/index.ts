import createDebug from 'debug';
import { Readable } from 'stream';
import { URL, UrlWithStringQuery, parse } from 'url';

// Built-in protocols
import data from './data';
import file from './file';
import ftp from './ftp';
import http from './http';
import https from './https';

const debug = createDebug('get-uri');

/**
 * Async function that returns a `stream.Readable` instance to the
 * callback function that will output the contents of the given URI.
 *
 * For caching purposes, you can pass in a `stream` instance from a previous
 * `getUri()` call as a `cache: stream` option, and if the destination has
 * not changed since the last time the endpoint was retreived then the callback
 * will be invoked with an Error object with `code` set to "ENOTMODIFIED" and
 * `null` for the "stream" instance argument. In this case, you can skip
 * retreiving the file again and continue to use the previous payload.
 *
 * @param {String} uri URI to retrieve
 * @param {Object} opts optional "options" object
 * @param {Function} fn callback function
 * @api public
 */
function getUri(uri: string, fn: getUri.GetUriCallback): void;
function getUri(
	uri: string,
	opts: getUri.GetUriOptions,
	fn: getUri.GetUriCallback
): void;
function getUri(uri: string, opts: getUri.GetUriOptions): Promise<Readable>;
function getUri(
	uri: string,
	opts?: getUri.GetUriOptions | getUri.GetUriCallback,
	fn?: getUri.GetUriCallback
): Promise<Readable> | void {
	const p = new Promise<Readable>((resolve, reject) => {
		debug('getUri(%o)', uri);

		if (typeof opts === 'function') {
			fn = opts;
			opts = undefined;
		}

		if (!uri) {
			reject(new TypeError('Must pass in a URI to "get"'));
			return;
		}

		const parsed = parse(uri);

		// Strip trailing `:`
		const protocol = (parsed.protocol || '').replace(/\:$/, '');
		if (!protocol) {
			reject(new TypeError(`URI does not contain a protocol: ${uri}`));
			return;
		}

		const getter = getUri.protocols[protocol];

		if (typeof getter !== 'function') {
			throw new TypeError(
				`Unsupported protocol "${protocol}" specified in URI: ${uri}`
			);
		}

		resolve(getter(parsed, opts || {}));
	});

	if (typeof fn === 'function') {
		p.then(rtn => fn!(null, rtn), err => fn!(err));
	} else {
		return p;
	}
}

namespace getUri {
	export interface GetUriOptions {
		cache?: Readable;
	}
	export type GetUriCallback = (err?: Error | null, res?: Readable) => void;
	export type GetUriProtocol = (
		parsed: UrlWithStringQuery,
		opts: getUri.GetUriOptions
	) => Promise<Readable>;
	export const protocols: { [key: string]: getUri.GetUriProtocol } = {
		data,
		file,
		ftp,
		http,
		https
	};
}

export = getUri;
