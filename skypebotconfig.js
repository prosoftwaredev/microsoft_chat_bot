'use strict';

module.exports = class SkypeBotConfig {

    get apiaiAccessToken() {
        return this._apiaiAccessToken;
    }

    set apiaiAccessToken(value) {
        this._apiaiAccessToken = value;
    }

    get apiaiLang() {
        return this._apiaiLang;
    }

    set apiaiLang(value) {
        this._apiaiLang = value;
    }

    get skypeBotId() {
        return this._skypeBotId;
    }

    set skypeBotId(value) {
        this._skypeBotId = value;
    }

    get skypeAppId() {
        return this._skypeAppId;
    }

    set skypeAppId(value) {
        this._skypeAppId = value;
    }

    get skypeAppSecret() {
        return this._skypeAppSecret;
    }

    set skypeAppSecret(value) {
        this._skypeAppSecret = value;
    }

    get devConfig() {
        return this._devConfig;
    }

    set devConfig(value) {
        this._devConfig = value;
    }

    get redShiftConnectionString() {
        return this._redShiftConnectionString;
    }

    set redShiftConnectionString(value) {
        this._redShiftConnectionString = value;
    }

    get redShiftTableName() {
        return this._redShiftTableName;
    }

    set redShiftTableName(value) {
        this._redShiftTableName = value;
    }

    get redShiftDateColumnName() {
        return this._redShiftDateColumnName;
    }

    set redShiftDateColumnName(value) {
        this._redShiftDateColumnName = value;
    }

    constructor(apiaiAccessToken, apiaiLang, appId, appSecret, redShiftConnectionString, redShiftTableName, redShiftDateColumnName) {
        this._apiaiAccessToken = apiaiAccessToken;
        this._apiaiLang = apiaiLang;
        this._skypeAppId = appId;
        this._skypeAppSecret = appSecret;
        this._redShiftConnectionString = redShiftConnectionString;
        this._redShiftTableName = redShiftTableName;
        this._redShiftDateColumnName = redShiftDateColumnName;
    }

    toPlainDoc() {
        return {
            apiaiAccessToken: this._apiaiAccessToken,
            apiaiLang: this._apiaiLang,
            skypeAppId: this._skypeAppId,
            skypeAppSecret: this._skypeAppSecret,
            redShiftConnectionString: this._redShiftConnectionString,
            redShiftTableName: this._redShiftTableName,
            redShiftDateColumnName: this._redShiftDateColumnName,

        }
    }

    static fromPlainDoc(doc){
        return new SkypeBotConfig(
            doc.apiaiAccessToken,
            doc.apiaiLang,
            doc.skypeAppId, 
            doc.skypeAppSecret,
            doc.redShiftConnectionString,
            doc.redShiftTableName,
            doc.redShiftDateColumnName
            );
    }
};