import AbstractSource from "./AbstractSource.js";
import {readJson, readText, writeFile} from "../utils.js";
import {createJWT} from 'node-musickit-api/modules/createJWT.js';
import MusicKit from 'node-musickit-api/personalized/index.js';
import {AppleSourceConfig} from "../common/infrastructure/config/source/apple.js";
import {InternalConfig} from "../common/infrastructure/Atomic.js";
import {EventEmitter} from "events";

export default class AppleSource extends AbstractSource {

    requiresAuth = true;
    requiresAuthInteraction = true;
    keyContents;
    apiClient;

    workingCredsPath: string;

    constructor(name, config: AppleSourceConfig, internal: InternalConfig, emitter: EventEmitter) {
        super('apple', name, config, internal, emitter);

        this.workingCredsPath = `${this.configDir}/currentCreds-apple-${name}.json`;
        this.canPoll = true;
    }

    initialize = async () => {
        // support both history proxy client / server flows

        // server flow
        if (this.config.data.key !== undefined || this.config.data.teamId !== undefined || this.config.data.keyId !== undefined) {
            if (this.config.data.key === undefined) {
                throw new Error(`For apple source as SERVER the property 'key' must be defined`);
            } else {
                // try to parse as file
                try {
                    this.keyContents = await readText(this.config.data.key)
                    if (this.keyContents === undefined) {
                        // could not find as file, thats fine
                        this.keyContents = this.config.data.key;
                    }
                } catch (e) {
                    throw new Error(`Apple config 'key' property seems to be a valid file path but could not be read: ${e.message}`);
                }
            }
            if (this.config.data.teamId === undefined) {
                throw new Error(`For apple source as SERVER the property 'teamId' must be defined`);
            }
            if (this.config.data.keyId === undefined) {
                throw new Error(`For apple source as SERVER the property 'keyId' must be defined`);
            }
        }

        if (this.config.data.endpoint !== undefined) {
            try {
                const credFile = await readJson(this.workingCredsPath, {throwOnNotFound: false});
                this.config.data.userToken = credFile.userToken;
                // temp
                this.apiClient = new MusicKit({
                    key: this.keyContents,
                    teamId: this.config.data.teamId,
                    keyId: this.config.data.keyId,
                    userToken: this.config.data.userToken,
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
            teamId: this.config.data.teamId,
            keyId: this.config.data.keyId,
        });
    }

    doSomething = async () => {
        this.apiClient = new MusicKit({
            key: this.keyContents,
            teamId: this.config.data.teamId,
            keyId: this.config.data.keyId,
            userToken: 'aToken',
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
        this.config.data.userToken = token;
        this.logger.info('Got apple user music token callback!');
        // temp
        this.apiClient = new MusicKit({
            key: this.keyContents,
            teamId: this.config.data.teamId,
            keyId: this.config.data.keyId,
            userToken: this.config.data.userToken,
        })
        return true;
    }
}
