import once from '@tootallnate/once';
import FTP, { ListingElement, Options } from 'ftp';
import { Readable } from 'stream';
import { basename, dirname } from 'path';
import createDebug from 'debug';
import NotFoundError from './notfound';
import NotModifiedError from './notmodified';
import { GetUriProtocol } from '.';

const debug = createDebug('get-uri:ftp');

export interface FTPReadable extends Readable {
	lastModified?: Date;
}

export interface FTPOptions extends Options {
	cache?: FTPReadable;
	debug?: (s: string) => void;
}

/**
 * Returns a Readable stream from an "ftp:" URI.
 */
export const ftp: GetUriProtocol<FTPOptions> = async (url, opts = {}) => {
	const { cache } = opts;
	const filepath = url.pathname;
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
		opts.host = url.hostname || url.host || 'localhost';
		opts.port = parseInt(url.port || '0', 10) || 21;
		opts.debug = debug;

		if (url.username) {
			opts.user = url.username;
		}
		if (url.password) {
			opts.password = url.password;
		}

		const readyPromise = once(client, 'ready');
		client.connect(opts);
		await readyPromise;

		// first we have to figure out the Last Modified date.
		// try the MDTM command first, which is an optional extension command.
		try {
			lastModified = await new Promise((resolve, reject) => {
				client.lastMod(filepath, (err, res) => {
					return err ? reject(err) : resolve(res);
				});
			});
		} catch (err: any) {
			// handle the "file not found" error code
			if (err.code === 550) {
				throw new NotFoundError();
			}
		}

		if (!lastModified) {
			// Try to get the last modified date via the LIST command (uses
			// more bandwidth, but is more compatible with older FTP servers
			const list = await new Promise<ListingElement[]>(
				(resolve, reject) => {
					client.list(dirname(filepath), (err, res) => {
						return err ? reject(err) : resolve(res);
					});
				}
			);

			// attempt to find the "entry" with a matching "name"
			const name = basename(filepath);
			const entry = list.find((e) => e.name === name);
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
		const rs = (await new Promise<NodeJS.ReadableStream>(
			(resolve, reject) => {
				client.get(filepath, (err, res) => {
					return err ? reject(err) : resolve(res);
				});
			}
		)) as FTPReadable;
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
			return +cache.lastModified === +lastModified;
		}
		return false;
	}
};
