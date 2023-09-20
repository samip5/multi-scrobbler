import { CommonClientConfig, CommonClientData } from "./index";
import { RequestRetryOptions } from "../common";
import {LastfmCredentials} from "../apiServices/lastfm.js";

export interface LastfmData extends RequestRetryOptions, LastfmCredentials {
}

export interface LastfmClientConfig extends CommonClientConfig {
    /**
     * Should always be `client` when using LastFM as a client
     *
     * @default client
     * @examples ["client"]
     * */
    configureAs?: 'client' | 'source'
    data: CommonClientData & LastfmData
    useAsParser?: boolean
}

export interface LastfmClientAIOConfig extends LastfmClientConfig {
    type: 'lastfm'
}
