import {CommonSourceConfig, CommonSourceData} from "./index.js";
import {PollingOptions} from "../common.js";
import {MopidyData} from "./mopidy.js";

export interface AppleData extends CommonSourceData, PollingOptions {
    keyId: string
    teamId: string
    key: string

    endpoint?: string
    userToken?: string
}

export interface AppleSourceConfig extends CommonSourceConfig {
    data: AppleData
}

export interface AppleSourceAIOConfig extends AppleSourceConfig {
    type: 'apple'
}
