import 'dotenv/config';
import {Logger} from '@foxxmd/winston';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import {
    parseBool,
    readJson,
    sleep
} from "./utils";
import * as path from "path";
import {projectDir} from "./common/index";
import SpotifySource from "./sources/SpotifySource";
import { AIOConfig } from "./common/infrastructure/config/aioConfig";
import { getRoot } from "./ioc";
import {getLogger} from "./common/logging";
import {LogInfo} from "../core/Atomic";
import {initServer} from "./server/index";
import {SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {createHeartbeatSourcesTask} from "./tasks/heartbeatSources";
import {createHeartbeatClientsTask} from "./tasks/heartbeatClients";
import {AppleSource} from "./sources/AppleSource";


dayjs.extend(utc)
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(timezone);

(async function () {

const scheduler = new ToadScheduler()

let output: LogInfo[] = []

const initLogger = getLogger({file: false}, 'init');
initLogger.stream().on('log', (log: LogInfo) => {
    output.unshift(log);
    output = output.slice(0, 301);
});

let logger: Logger;

const configDir = process.env.CONFIG_DIR || path.resolve(projectDir, `./config`);

    try {
        initLogger.debug(`Config Dir ENV: ${process.env.CONFIG_DIR} -> Resolved: ${configDir}`)
        // try to read a configuration file
        let appConfigFail: Error | undefined = undefined;
        let config = {};
        try {
            config = await readJson(`${configDir}/config.json`, {throwOnNotFound: false});
        } catch (e) {
            appConfigFail = e;
        }

        const {
            webhooks = [],
            logging = {},
            debugMode,
        } = (config || {}) as AIOConfig;

        if (process.env.DEBUG_MODE === undefined && debugMode !== undefined) {
            process.env.DEBUG_MODE = debugMode.toString();
        }
        if(process.env.DEBUG_MODE !== undefined) {
            // make sure value is legit
            const b = parseBool(process.env.DEBUG_MODE);
            process.env.DEBUG_MODE = b.toString();
        }

        const root = getRoot(config);
        initLogger.info(`Version: ${root.get('version')}`);

        logger = getLogger(logging, 'app');

        initServer(logger, output);

        if(process.env.IS_LOCAL === 'true') {
            logger.info('multi-scrobbler can be run as a background service! See: https://foxxmd.github.io/multi-scrobbler/docs/installation/service');
        }

        if(appConfigFail !== undefined) {
            logger.warn('App config file exists but could not be parsed!');
            logger.warn(appConfigFail);
        }

        const notifiers = root.get('notifiers');
        await notifiers.buildWebhooks(webhooks);

        /*
        * setup clients
        * */
        const scrobbleClients = root.get('clients');
        await scrobbleClients.buildClientsFromConfig(notifiers);
        if (scrobbleClients.clients.length === 0) {
            logger.warn('No scrobble clients were configured!')
        } else {
            logger.info('Starting scrobble clients...');
        }
        for(const client of scrobbleClients.clients) {
            await client.initScrobbleMonitoring();
        }

        const scrobbleSources = root.get('sources');//new ScrobbleSources(localUrl, configDir);
        await scrobbleSources.buildSourcesFromConfig([]);

        // check ambiguous client/source types like this for now
        const lastfmSources = scrobbleSources.getByType('lastfm');
        const lastfmScrobbles = scrobbleClients.getByType('lastfm');

        const scrobblerNames = lastfmScrobbles.map(x => x.name);
        const nameColl = lastfmSources.filter(x => scrobblerNames.includes(x.name));
        if(nameColl.length > 0) {
            logger.warn(`Last.FM source and clients have same names [${nameColl.map(x => x.name).join(',')}] -- this may cause issues`);
        }

        let anyNotReady = false;
        for (const source of scrobbleSources.sources.filter(x => x.canPoll === true)) {
            await sleep(1500); // stagger polling by 1.5 seconds so that log messages for each source don't get mixed up
            switch (source.type) {
                case 'spotify':
                    if ((source as SpotifySource).spotifyApi !== undefined) {
                        if ((source as SpotifySource).spotifyApi.getAccessToken() === undefined) {
                            anyNotReady = true;
                        } else {
                            (source as SpotifySource).poll();
                        }
                    }
                    break;
                case 'lastfm':
                    if(source.initialized === true) {
                        source.poll();
                    }
                    break;
                default:
                    if (source.poll !== undefined) {
                        source.poll();
                    }
            }
        }
        if (anyNotReady) {
            logger.info(`Some sources are not ready, open the dashboard to continue`);
        }

        // TODO remove after using for testing
        //
        // do something with the authorized apple source api client
        //const apl = scrobbleSources.getByName('aap') as AppleSource;
        //const recentPlays = await apl.apiClient.getRecentlyPlayed(20, 0, "songs");
        //console.log(`Recent: ${JSON.stringify(recentPlays, null, 2)}`);


        scheduler.addSimpleIntervalJob(new SimpleIntervalJob({
            minutes: 20,
            runImmediately: false
        }, createHeartbeatSourcesTask(scrobbleSources, logger)));
        scheduler.addSimpleIntervalJob(new SimpleIntervalJob({
            minutes: 20,
            runImmediately: false
        }, createHeartbeatClientsTask(scrobbleClients, logger)));
        logger.info('Scheduler started.');

    } catch (e) {
        logger.error('Exited with uncaught error');
        logger.error(e);
    }
}());

