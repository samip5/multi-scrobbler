export interface ListenBrainzCredentials {
    /**
     * User token for the user to scrobble for
     *
     * @examples ["6794186bf-1157-4de6-80e5-uvb411f3ea2b"]
     * */
    token: string

    /**
     * URL for the ListenBrainz server, if not using the default
     *
     * @examples ["https://api.listenbrainz.org/"]
     * @default "https://api.listenbrainz.org/"
     * */
    url?: string
}
