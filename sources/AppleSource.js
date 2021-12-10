import AbstractSource from "./AbstractSource.js";
import {parseRetryAfterSecsFromObj, readJson, readText, sleep, sortByPlayDate, writeFile} from "../utils.js";
import {createJWT} from 'node-musickit-api/modules/createJWT.js';
import MusicKit from 'node-musickit-api/personalized/index.js';

export default class AppleSource extends AbstractSource {

    requiresAuth = true;
    requiresAuthInteraction = true;
    keyContents;
    apiClient;

    constructor(name, config = {}, clients = []) {
        super('apple', name, config, clients);
        const {
            configDir,
            interval = 60,
        } = config;

        if (interval < 15) {
            this.logger.warn('Interval should be above 30 seconds...😬');
        }

        this.config.interval = interval;

        this.configDir = configDir;
        this.workingCredsPath = `${configDir}/currentCreds-apple-${name}.json`;
        this.canPoll = true;
    }

    initialize = async () => {
        // support both history proxy client / server flows

        // server flow
        if (this.config.key !== undefined || this.config.teamId !== undefined || this.config.keyId !== undefined) {
            if (this.config.key === undefined) {
                throw new Error(`For apple source as SERVER the property 'key' must be defined`);
            } else {
                // try to parse as file
                try {
                    this.keyContents = await readText(this.config.key, {throwOnNotFound: false})
                    if (this.keyContents === undefined) {
                        // could not find as file, thats fine
                        this.keyContents = this.config.key;
                    }
                } catch (e) {
                    throw new Error(`Apple config 'key' property seems to be a valid file path but could not be read: ${e.message}`);
                }
            }
            if (this.config.teamId === undefined) {
                throw new Error(`For apple source as SERVER the property 'teamId' must be defined`);
            }
            if (this.config.keyId === undefined) {
                throw new Error(`For apple source as SERVER the property 'keyId' must be defined`);
            }
        }

        if (this.config.endpoint !== undefined) {
            try {
                const credFile = await readJson(this.workingCredsPath, {throwOnNotFound: false});
                this.config.userToken = credFile.userToken;
                // temp
                this.apiClient = new MusicKit({
                    key: this.keyContents,
                    teamId: this.config.teamId,
                    keyId: this.config.keyId,
                    userToken: this.config.userToken,
                })
            } catch (e) {
                this.logger.warn('Current apple credentials file exists but could not be parsed', {path: this.workingCredsPath});
            }
        }

        this.initialized = true;
        return this.initialized;
    }

    generateDeveloperToken = () => {
        return createJWT({
            key: this.keyContents,
            teamId: this.config.teamId,
            keyId: this.config.keyId,
        });
    }

    doSomething = async () => {
        this.apiClient = new MusicKit({
            key: this.keyContents,
            teamId: this.config.teamId,
            keyId: this.config.keyId,
            userToken: 'Ajwe9DQ1AennRPrvGMu1aTIm6Az9iZcVmavZODjRXFju1XFxpTuSnIWDTKeR9JaUCLYqFM1fd9d0eGS3UPBrjIQqLorbEn5BaTsdZpxeh8Lzsel3NI0e1d4CYjI9hair+YZpNW49KAG6IzjrxO+P4Cm+I5Q+VBJ9L9dTdf3yZ+ogLzybDwKx4jHCUjfLra3HymOx9yxQB3dk69eUltalMrfFIpBjljZbG1SQl+LO9k7emc29Tg==',
        })
        try {
            const plays = await this.apiClient.getRecentlyPlayed(20, 0, 'songs');
            const e = 1;
        } catch (err) {
            const f = 1;
        }
    }

    handleAuthCodeCallback = async ({token}) => {
        await writeFile(this.workingCredsPath, JSON.stringify({
            userToken: token
        }));
        this.config.userToken = userToken;
        this.logger.info('Got apple user music token callback!');
        // temp
        this.apiClient = new MusicKit({
            key: this.keyContents,
            teamId: this.config.teamId,
            keyId: this.config.keyId,
            userToken: this.config.userToken,
        })
        return true;
    }
}
