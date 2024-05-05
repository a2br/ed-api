import fetch, { RequestInit } from "node-fetch";
import mime from "mime-types";
import { base64, failureRes, isFailure, root, rootp } from "ecoledirecte-api-types/v3";

import logs from "../events";
import { EcoleDirecteAPIError } from "../errors";
import EventEmitter from "events";
import { Account } from "../accounts";

export type A2FReplies = { [utf8_sentence: string]: string }

export function decodeBase64(str: base64) {
    const binaryStrBuffer = Buffer.from(str, 'base64');
    return binaryStrBuffer.toString('utf8');
}

export function encodeBase64(str: string) {
	const utf8Buffer = Buffer.from(str, 'utf-8');
    return utf8Buffer.toString('base64');
}

export function toISODate(date: Date | string | number): string {
	const d = new Date(date);
	if (isNaN(d.getTime())) throw new Error("Invalid date");

	return [
		d.getFullYear(),
		(d.getMonth() + 1).toString().padStart(2, "0"),
		d.getDate().toString().padStart(2, "0"),
	].join("-");
}

/**
 *
 * @description Makes bytes human-readable
 */
export function formatBytes(bytes: number): string {
	let formatted: string;
	if (bytes >= 1073741824) {
		formatted = (bytes / 1073741824).toFixed(2) + " GB";
	} else if (bytes >= 1048576) {
		formatted = (bytes / 1048576).toFixed(2) + " MB";
	} else if (bytes >= 1024) {
		formatted = (bytes / 1024).toFixed(2) + " KB";
	} else if (bytes > 1) {
		formatted = bytes + " bytes";
	} else if (bytes === 1) {
		formatted = bytes + " byte";
	} else {
		formatted = "0 bytes";
	}
	return formatted;
}

function getFileName(contentDisposition: string): string {
	const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-\.]+)(?:; ?|$)/i;
	const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;

	let fileName = "";
	if (utf8FilenameRegex.test(contentDisposition)) {
		const execArray = utf8FilenameRegex.exec(contentDisposition);
		fileName = decodeURIComponent(execArray ? execArray[1] : "");
	} else {
		// prevent ReDos attacks by anchoring the ascii regex to string start and
		//  slicing off everything before 'filename='
		const filenameStart = contentDisposition.toLowerCase().indexOf("filename=");
		if (filenameStart >= 0) {
			const partialDisposition = contentDisposition.slice(filenameStart);
			const matches = asciiFilenameRegex.exec(partialDisposition);
			if (matches != null && matches[2]) {
				fileName = matches[2];
			}
		}
	}
	return fileName;
}

export async function makeRequest(
	options: {
		method: "GET" | "POST";
		path: string;
		body?: Record<string, unknown>;
		guard?: boolean;
		teachRoot?: boolean;
		expectBuffer?: boolean;
	},
	context: Record<string, unknown> = {},
	account?: Account,
	token?: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const { method, path, body, guard, teachRoot, expectBuffer } = options;
	const url = Config.get(teachRoot ? "rootp" : "root") + path;
	const resListener = new EventEmitter();
	function onRes(callback: (res: Response) => void) {
		resListener.on("response", callback);
	}
	function offRes(callback: (res: Response) => void) {
		resListener.off("response", callback);
	}
	const params: RequestInit = {
		method: method,
		headers: {
			...EdHeaders,
			"x-token": (token || account?.token) ?? "",
			...Config.get("addedHeaders"),
		},
	};
	logs.emit("request", {
		method,
		url,
		body,
		headers: params.headers,
		context,
		onRes,
		offRes,
	});

	if (method === "POST") {
		const urlencoded = new URLSearchParams();
		urlencoded.append("data", JSON.stringify(body));
		params.body = urlencoded;
	}

	const response = await fetch(url, params);

	const resBody = expectBuffer
		? await response.buffer()
		: ((await response.json()) as Record<string, unknown>);

	resListener.emit("response", { response, body: resBody });

	const failure =
		!expectBuffer && isFailure(resBody as Record<string, unknown>);
	if (guard && failure) throw new EcoleDirecteAPIError(resBody as failureRes);

	const someToken =
		(!expectBuffer &&
			((resBody as Record<string, unknown>).token as string | undefined)) ||
		response.headers.get("x-token");

	if (!failure && account && someToken) account.token = someToken;

	if (expectBuffer) {
		const buff = resBody as Buffer;
		const contentDisposition = response.headers.get("content-disposition");
		if (!contentDisposition) throw new Error("No content-disposition");
		// Get file name
		const fileName = getFileName(contentDisposition);
		// Get MIME type
		const mimeType = mime.lookup(fileName);
		// Create Blob
		const blob = new Blob([buff], { type: mimeType || undefined });
		return blob;
	}

	return resBody;
}

export const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";

export const EdHeaders = {
	authority: "api.ecoledirecte.com",
	accept: "application/json, text/plain, */*",
	"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
	"content-type": "application/x-www-form-urlencoded",
	origin: "https://www.ecoledirecte.com",
	"sec-fetch-dest": "empty",
	"sec-fetch-mode": "cors",
	"sec-fetch-site": "same-site",
	referer: "https://www.ecoledirecte.com/",
	"user-agent": USER_AGENT,
};

export type FullConfig = {
	root: string;
	rootp: string;
	addedHeaders: Record<string, string>;
};

export type PartialConfig = Partial<FullConfig>;

export const DefaultConfig: FullConfig = {
	root: root,
	rootp: rootp,
	addedHeaders: {},
};

export class ConfigConstructor {
	static instance = new ConfigConstructor();

	constructor(public source: PartialConfig = {}) {}
	get<K extends keyof FullConfig>(key: K): FullConfig[K] {
		const fromSource = this.source[key] as FullConfig[K] | undefined;
		const fromDefault = DefaultConfig[key];
		return fromSource ?? fromDefault;
	}
}

export const Config = ConfigConstructor.instance;
