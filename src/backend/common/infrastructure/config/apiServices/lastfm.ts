export interface LastfmCredentials {
    /**
     * API Key generated from Last.fm account
     *
     * @examples ["787c921a2a2ab42320831aba0c8f2fc2"]
     * */
    apiKey: string
    /**
     * Secret generated from Last.fm account
     *
     * @examples ["ec42e09d5ae0ee0f0816ca151008412a"]
     * */
    secret: string
    /**
     * Optional session id returned from a completed auth flow
     * */
    session?: string
    /**
     * Optional URI to use for callback. Specify this if callback should be different than the default. MUST have "lastfm/callback" in the URL somewhere.
     *
     * @default "http://localhost:9078/lastfm/callback"
     * @examples ["http://localhost:9078/lastfm/callback"]
     * */
    redirectUri?: string
}
