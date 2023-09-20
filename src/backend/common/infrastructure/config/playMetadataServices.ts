import {MusicBrainzCredentials} from "./apiServices/musicbrainz.js";
import {LastfmCredentials} from "./apiServices/lastfm.js";

export interface MusicBrainzMetadata extends MusicBrainzCredentials {
    score?: number
}

export interface MetadataServices {
    /**
     * Enable or disable service usage globally
     *
     * @default true
     * */
    enable?: boolean
    order?: ('lastfm' | 'musicbrainz')[]
    services?: {
        musicbrainz: MusicBrainzMetadata
        lastfm: LastfmCredentials
    }
}
