import FTP, { Options } from 'ftp';
import { Readable } from 'stream';
import { basename, dirname } from 'path';
import { UrlWithStringQuery } from 'url';
import { promisify } from 'util';
import createDebug from 'debug';
import { GetUriOptions } from '.';
import once from './once';
import NotFoundError from './notfound';
import NotModifiedError from './notmodified';

const debug = createDebug('get-uri:ftp');

interface FTPReadable extends Readable {
	lastModified?: Date;
}

interface FTPOptions extends GetUriOptions, Options {
	cache?: FTPReadable;
	debug?: (s: string) => void;
}

/**
 * Returns a Readable stream from an "ftp:" URI.
 */
export default async function get(
	parsed: UrlWithStringQuery,
	opts: FTPOptions
): Promise<Readable> {
	const { cache } = opts;
	const filepath = parsed.pathname;
	let lastModified: Date | null = null;

	if (!filepath) {
		throw new TypeError('No "pathname"!');
	}

	const client = new FTP();
	client.once('greeting', (greeting: string) => {
		debug('FTP greeting: %o', greeting);
	});

	function onend() {
		// close the FTP client socket connection
		client.end();
	}

	try {
		opts.host = parsed.hostname || parsed.host || 'localhost';
		opts.port = parseInt(parsed.port || '0', 10) || 21;
		opts.debug = debug;

		if (parsed.auth) {
			const [user, password] = parsed.auth.split(':');
			opts.user = user;
			opts.password = password;
		}

		// await cb(_ => client.connect(opts, _));
		const readyPromise = once(client, 'ready');
		client.connect(opts);
		await readyPromise;

		// first we have to figure out the Last Modified date.
		// try the MDTM command first, which is an optional extension command.
		try {
			const lastMod = promisify(client.lastMod.bind(client));
			lastModified = await lastMod(filepath);
		} catch (err) {
			// handle the "file not found" error code
			if (err.code === 550) {
				throw new NotFoundError();
			}
		}

		if (!lastModified) {
			// Try to get the last modified date via the LIST command (uses
			// more bandwidth, but is more compatible with older FTP servers
			const getList = promisify(client.list.bind(client));
			// @ts-ignore
			const list = await getList(dirname(filepath));
			// attempt to find the "entry" with a matching "name"
			const name = basename(filepath);
			let entry;
			for (let i = 0; i < list.length; i++) {
				entry = list[i];
				debug('file %o: %o', i, entry.name);
				if (entry.name === name) {
					break;
				}
				entry = null;
			}
			if (entry) {
				lastModified = entry.date;
			}
		}

		if (lastModified) {
			if (isNotModified()) {
				throw new NotModifiedError();
			}
		} else {
			throw new NotFoundError();
		}

		// XXX: a small timeout seemed necessary otherwise FTP servers
		// were returning empty sockets for the file occasionally
		// setTimeout(client.get.bind(client, filepath, onfile), 10);
		const getFile = promisify(client.get.bind(client));
		const rs = (await getFile(filepath)) as FTPReadable;
		rs.once('end', onend);
		rs.lastModified = lastModified;
		return rs;
	} catch (err) {
		client.destroy();
		throw err;
	}

	// called when `lastModified` is set, and a "cache" stream was provided
	function isNotModified(): boolean {
		if (cache && cache.lastModified && lastModified) {
			return +cache.lastModified == +lastModified;
		}
		return false;
	}
}
