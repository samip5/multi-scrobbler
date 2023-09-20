import AbstractApiClient from "./AbstractApiClient";
import {MusicBrainzApi} from 'musicbrainz-api';
import {PlayObject} from "../../../core/Atomic";
import {IMatch, IRecording, ISearchResult} from "musicbrainz-api/lib/musicbrainz.types.js";
import {FormatPlayObjectOptions} from "../infrastructure/Atomic";
import {MusicBrainzMetadata} from "../infrastructure/config/playMetadataServices";

export interface IRecordingMatch extends IRecording, IMatch {
}

export interface IRecordingList extends ISearchResult {
    recordings: IRecordingMatch[]
}

export interface MatchOptions {
    score?: number
}

export class MusicBrainzApiClient extends AbstractApiClient {

    client: MusicBrainzApi
    declare config: MusicBrainzMetadata;

    constructor(config: MusicBrainzMetadata) {
        super('MusicBrainz', '', config);
        this.client = new MusicBrainzApi({
            appName: config.appName ?? 'multi-scrobbler',
            appVersion: config.appVersion ?? 'dev',
            appContactInfo: config.email
        });
    }

    findMatch = async (play: PlayObject, options?: MatchOptions): Promise<PlayObject | undefined> => {

        if(play.meta.mbid !== undefined) {
            return play;
        }

        let matches: IRecordingMatch[] = [];
        try {
            const result = await this.client.search<IRecordingList>('recording', {
                query: {
                    artist: play.data.artists[0],
                    recording: play.data.track
                }
            });
            matches = result.recordings;
        } catch (err) {
            throw err;
        }
        if (matches.length === 0) {
            return undefined;
        }
        const {score = (this.config.score ?? 95)} = options || {};
        let validCandidates: IRecordingMatch[] = [];
        let closestScore: number = 0;
        for (const match of matches) {
            if (match.score > closestScore) {
                closestScore = match.score;
            }
            if (match.score >= score && match.length !== undefined) {
                validCandidates.push(match);
                break;
            }
        }
        if (validCandidates.length === 0) {
            this.logger.debug(`Found ${matches.length} matches but none with score >= ${score} (closest ${closestScore})`);
            return undefined;
        }

        // TODO try to match by provided artists and album

        return MusicBrainzApiClient.formatPlayObj(validCandidates[0]);
    }

    static formatPlayObj = (obj: IRecording | IRecordingMatch, options?: FormatPlayObjectOptions): PlayObject => {
            return {
                data: {
                    track: obj.title,
                    artists: obj["artist-credit"].map(x => x.name),
                    duration: obj.length / 1000,
                    album: obj.releases.length === 0 ? undefined : obj.releases[0].title
                },
                meta: {
                    source: 'musicbrainz',
                    playId: obj.id,
                    mbid: obj.id,
                    score: 'score' in obj ? obj.score : undefined
                }
            }
    }
}
