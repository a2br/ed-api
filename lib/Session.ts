import { loginRes, isFailure } from "ecoledirecte-api-types/v3";
import { A2FReplies, decodeBase64, encodeBase64, getA2FQCM, getMainAccount, login, postA2FRes } from "./util";
import { Family, Staff, Student, Teacher } from "./accounts";
import { EcoleDirecteAPIError } from "./errors";
import logs from "./events";

export class Session {
	private _username: string;
	private _password: string;
	/**
	 * @async
	 * @returns EcoleDirecte login response
	 */
	public loginRes?: loginRes;
	private _token = "";

	get token(): string {
		return this._token;
	}

	set token(value: string) {
		logs.emit("newToken", {
			oldToken: this._token,
			newToken: value,
			session: this,
		});
		this._token = value;
	}

	constructor(username: string, password: string) {
		(this._username = username), (this._password = password);
	}

	async login(
		A2FResponses: A2FReplies | undefined,
		context: Record<string, unknown> = {}
	): Promise<Family | Staff | Student | Teacher> {
		const { _username: username, _password: password } = this;
		let loginRes = await login(username, password, null, context);

		if (loginRes.code == 250) {

			const A2FQCM = await getA2FQCM(loginRes.token, context);

			if (isFailure(A2FQCM)) throw new EcoleDirecteAPIError(A2FQCM); 

			const question = decodeBase64(A2FQCM.data.question);
			 
			if (!A2FResponses) throw new Error("A2F needed");
			if (typeof A2FResponses[question] != 'string') throw new Error(`A2F needed for the question : ${question}`);

			const A2Ffa = await postA2FRes(loginRes.token, encodeBase64(A2FResponses[question]), context);

			if (isFailure(A2Ffa)) throw new EcoleDirecteAPIError(A2Ffa); 

			const finalLogin = await login(username, password, [ A2Ffa.data ], context);

			if (isFailure(finalLogin) || finalLogin.code != 200) throw new EcoleDirecteAPIError(finalLogin);

			loginRes = finalLogin
			this.token = finalLogin.token;
			this.loginRes = finalLogin;

		} else {
			this.loginRes = loginRes;
			this.token = loginRes.token;
			if (isFailure(loginRes)) throw new EcoleDirecteAPIError(loginRes);
		}

		// Login succeeded

		const account = getMainAccount(loginRes.data.accounts);
		switch (account.typeCompte) {
			case "E":
				return new Student(this);
			case "1":
				return new Family(this);
			case "P":
				return new Teacher(this);
			case "A":
				return new Staff(this);
			default:
				throw new Error(
					`UNKNOWN ACCOUNT TYPE: '${
						(account as { typeCompte: string }).typeCompte
					}'`
				);
		}
	}

	/**
	 * @returns Given credentials
	 */
	get credentials(): { username: string; password: string } {
		const credentials = { username: this._username, password: this._password };
		return credentials;
	}
}
