export namespace main {
	
	export class Config {
	    locale: string;
	    autosave: boolean;
	    defaultBaseCurrency: string;
	    defaultCurrencies: string[];
	    taxReportHiddenFields: string[];
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.locale = source["locale"];
	        this.autosave = source["autosave"];
	        this.defaultBaseCurrency = source["defaultBaseCurrency"];
	        this.defaultCurrencies = source["defaultCurrencies"];
	        this.taxReportHiddenFields = source["taxReportHiddenFields"];
	    }
	}

}

