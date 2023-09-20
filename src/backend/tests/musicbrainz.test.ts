import {describe, it} from 'mocha';
import {assert} from 'chai';
import {getLogger} from "../common/logging";
import {MusicBrainzApiClient} from "../common/vendor/MusicBrainzApiClient";
import singleArtist from './musicbrainz/singleArtistPlayObj.json';
import {PlayObject} from "../../core/Atomic";

interface MusicBrainzTestFixture {
    play: PlayObject,
    expected: {
        artists: string[]
        track: string
    }
}
describe('Musicbrainz Play Parsing', function () {
    const logger = getLogger({}, 'app');
    const client = new MusicBrainzApiClient({email: 'musicbrainz@foxxmd.dev'});

    it('Returns a Play object with MBID', async function () {
        for(const test of singleArtist as unknown as MusicBrainzTestFixture[]) {
            const play = await client.findMatch(test.play);
            assert.equal(play.data.track, test.expected.track);
            assert.sameDeepMembers(play.data.artists, test.expected.artists);
        }
    });
});
