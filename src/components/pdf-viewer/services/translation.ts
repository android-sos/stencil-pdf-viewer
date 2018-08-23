import 'webl10n';

let webL10n = (document as any).webL10n;

export class TranslationService {

    private _lang: string;

    private _ready: Promise<any>;

    constructor(lang) {
        this._lang = lang;
        this._ready = new Promise(resolve => {
            webL10n.setLanguage(lang, () => {
                resolve(webL10n);
            });
        });
    }

    getLanguage() {
        return this._ready.then((l10n) => {
            return l10n.getLanguage();
        });
    }

    getDirection() {
        return this._ready.then((l10n) => {
            return l10n.getDirection();
        });
    }

    get(property, args, fallback) {
        return this._ready.then((l10n) => {
            return l10n.get(property, args, fallback);
        });
    }

    translate(element) {
        return this._ready.then((l10n) => {
            return l10n.translate(element);
        });
    }

    get lang() {
        return this._lang;
    }

}
