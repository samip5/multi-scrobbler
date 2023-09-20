import { CommonClientConfig, CommonClientData } from "./index";
import { RequestRetryOptions } from "../common";
import {ListenBrainzCredentials} from "../apiServices/listenbrainz.js";

export interface ListenBrainzData extends RequestRetryOptions, ListenBrainzCredentials{
    /**
     * Username of the user to scrobble for
     * */
    username: string
}

export interface ListenBrainzClientData extends ListenBrainzData, CommonClientData {}

export interface ListenBrainzClientConfig extends CommonClientConfig {
    /**
     * Should always be `client` when using Listenbrainz as a client
     *
     * @default client
     * @examples ["client"]
     * */
    configureAs?: 'client' | 'source'
    data: ListenBrainzClientData
}

export interface ListenBrainzClientAIOConfig extends ListenBrainzClientConfig {
    type: 'listenbrainz'
}
