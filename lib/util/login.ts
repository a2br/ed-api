import { makeRequest } from "./util";
import { loginRes, account, A2FQCM, A2FQCMRes, Routes, base64 } from "ecoledirecte-api-types/v3";

/**
 * @returns EcoleDirecte `/v3/login.awp` response
 */
export async function login(
	username: string,
	password: string,
	fa: Array<{ cv: string, cn:string }> | null,
	context: Record<string, unknown> = {}
): Promise<loginRes> {
	const body: loginRes = await makeRequest(
		{
			method: "POST",
			path: Routes.login(),
			body: {
				identifiant: username,
				motdepasse: password,
				fa: Array.isArray(fa) ? fa : [],
			},
		},
		{ action: "login", username, password, ...context }
	);

	return body;
}

/**
 * @warning Token is the token sended by the first login response
 * @returns EcoleDirecte `/v3/connexion/doubleauth.awp?verbe=get` response
 */
export async function getA2FQCM(token: string, context: Record<string, unknown> = {}): Promise<A2FQCM> {

	const body: A2FQCM = await makeRequest({
		method: "POST",
		path: Routes.getA2FQCM(),
		body: {}
	}, { action: "A2FQCM", ...context }, undefined, token);

	return body;
}

/**
 * @warning Token is the token sended by the first login response
 * @returns EcoleDirecte `/v3/connexion/doubleauth.awp?verbe=post` response
 */

export async function postA2FRes(token: string, response: base64, context: Record<string, unknown> = {}): Promise<A2FQCMRes> {

	const body: A2FQCMRes = await makeRequest({
		method: "POST",
		path: Routes.postA2FRes(),
		body: {
			choix: response,
		}
	}, { action: "A2FQCMRes", ...context }, undefined, token);

	return body;
}


/**
 * @returns The main account of the array
 */
export function getMainAccount(accounts: Array<account>): account {
	const mainAccount = accounts.find(acc => acc.main) || accounts[0] || null;
	return mainAccount;
}
