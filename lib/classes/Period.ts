import { discipline, periode as _period } from "ecoledirecte-api-types/v3";
import { ExpandedBase64 } from "../classes";

export class Period {
	code: string;
	name: string;
	yearly: boolean;
	closed: boolean;
	start: Date;
	end: Date;
	mockExam: boolean;
	headcount?: number;
	rank?: number;
	headTeacher?: string;
	appraisals: {
		CE?: string;
		PP?: string;
		VS?: string;
	};
	class: {
		appraisal?: string;
		averageGrade?: number;
	};
	council: {
		start?: Date;
		end?: Date;
		room?: string;
		verdict?: string;
	};
	calcDate?: Date;
	subjects: Array<Subject>;
	_raw: _period;

	constructor(o: _period) {
		this.code = o.idPeriode;
		this.name = o.periode;
		this.yearly = o.annuel;
		this.closed = o.cloture;
		this.start = new Date(o.dateDebut);
		this.end = new Date(o.dateFin);
		this.mockExam = o.examenBlanc;
		this.headcount = o.ensembleMatieres.effectif
			? +o.ensembleMatieres.effectif
			: undefined;
		this.rank = o.ensembleMatieres.rang ? +o.ensembleMatieres.rang : undefined;
		this.headTeacher = o.ensembleMatieres.nomPP;
		this.appraisals = {
			CE: o.ensembleMatieres.appreciationCE,
			PP: o.ensembleMatieres.appreciationPP,
			VS: o.ensembleMatieres.appreciationVS,
		};
		this.class = {
			appraisal: o.ensembleMatieres.appreciationGeneraleClasse,
			averageGrade: o.ensembleMatieres.moyenneClasse
				? +o.ensembleMatieres.moyenneClasse.replace(/,/, ".")
				: undefined,
		};
		this.council = {
			start: o.dateConseil
				? new Date(o.dateConseil + " " + (o.heureConseil || ""))
				: undefined,
			end:
				o.dateConseil && o.heureFinConseil
					? new Date(o.dateConseil + " " + o.heureFinConseil)
					: undefined,
			room: o.salleConseil,
			verdict: o.ensembleMatieres.decisionDuConseil || undefined,
		};
		this.calcDate = o.ensembleMatieres.dateCalcul
			? new Date(o.ensembleMatieres.dateCalcul)
			: undefined;
		this.subjects = o.ensembleMatieres.disciplines.map(d => new Subject(d));
		this._raw = o;
	}
}

export class Subject {
	id: number;
	code: string;
	name: string;
	weight: number;
	headcount: number;
	rank: number;
	minorSubject: boolean;
	minorSubjectCode?: string;
	group: boolean;
	groupId: number;
	appraisals: Array<ExpandedBase64>;
	option: number;
	teachers: Array<{
		id: number;
		name: string;
	}>;
	class: {
		appraisal?: ExpandedBase64;
		max?: number;
		avg?: number;
		min?: number;
	};
	_raw: discipline;

	constructor(o: discipline) {
		this.id = o.id;
		this.code = o.codeMatiere;
		this.name = o.discipline;
		this.weight = o.coef;
		this.headcount = o.effectif;
		this.rank = o.rang;
		this.minorSubject = o.sousMatiere;
		this.minorSubjectCode = o.codeSousMatiere || undefined;
		this.group = o.groupeMatiere;
		this.groupId = o.idGroupeMatiere;
		this.appraisals = o.appreciations
			? o.appreciations.filter(a => !!a).map(a => new ExpandedBase64(a))
			: [];
		this.option = o.option;
		this.teachers = o.professeurs.map(p => ({
			id: p.id,
			name: p.nom,
		}));
		this.class = {
			appraisal: o.appreciationClasse
				? new ExpandedBase64(o.appreciationClasse)
				: undefined,
			max: o.moyenneMax ? +o.moyenneMax.replace(/,/, ".") : undefined,
			avg: o.moyenneClasse ? +o.moyenneClasse.replace(/,/, ".") : undefined,
			min: o.moyenneMin ? +o.moyenneMin.replace(/,/, ".") : undefined,
		};
		this._raw = o;
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	toJSON() {
		const toReturn = {
			id: this.id,
			code: this.code,
			name: this.name,
			weight: this.weight,
			headcount: this.headcount,
			rank: this.rank,
			minorSubject: this.minorSubject,
			minorSubjectCode: this.minorSubjectCode,
			group: this.group,
			groupId: this.groupId,
			appraisals: this.appraisals.map(a => a.original),
			option: this.option,
			teachers: this.teachers,
			class: {
				appraisal: this.class.appraisal?.original,
				max: this.class.max,
				avg: this.class.avg,
				min: this.class.min,
			},
			_raw: this._raw,
		};
		return toReturn;
	}
}
