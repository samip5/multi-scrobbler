import React, {useState, useCallback, Fragment} from 'react';
import './player.scss';
import PlayerTimestamp from "./PlayerTimestamp";
import {SourcePlayerJson} from "../../../core/Atomic";
import PlayerInfo from "./PlayerInfo";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars, faTimes} from '@fortawesome/free-solid-svg-icons'

import {capitalize} from "../../../core/StringUtils";

export interface PlayerProps {
    data: SourcePlayerJson
}

export interface Track {
    name: string
    artist: string
    album: string
    year: number
    duration: number
    artwork: string
}

const Player = (props: PlayerProps) => {
    const {
        data,
    } = props;

    const {
        play: {
            data: {
                track = '???',
                artists = ['???'],
                duration = 0
            } = {},
        } = {},
        play,
        listenedDuration,
        status: {
            calculated = '???',
            reported,
            stale,
            orphaned
        }
    } = data;

    let durPer = null;
    if(duration !== undefined && duration !== null && duration !== 0) {
        if(listenedDuration === 0) {
            durPer = ' (0%)';
        } else {
            durPer = ` (${((listenedDuration/duration) * 100).toFixed(0)}%)`;
        }
    }

    const [viewMode, setViewMode] = useState('player');

    const toggleViewMode = useCallback(() => {
        let newViewMode = "";
        switch(viewMode) {
            case "player":
                newViewMode = "playlist";
                break;
            case "playlist":
                newViewMode = "player"
                break;
        }
        setViewMode(newViewMode);
    }, [viewMode, setViewMode]);

    return (
            <article className={["player", "mb-2"].join(' ')}>
                <div className="player__wrapper">
                    <button className="button toggle-playlist" onClick={toggleViewMode}>
                        <FontAwesomeIcon color="black" icon={viewMode === 'playlist' ? faTimes : faBars}/>
                    </button>
                <section className="player__body">
                    <p className="title">{track}</p>
                    <p className="subtitle">{artists.join(' / ')}</p>
                    <PlayerTimestamp duration={duration} current={data.position || 0} />
                    <div className="flex">
                        <p className="stats flex-1 text-left">Status: {capitalize(calculated)}</p>
                        <p className="stats flex-1 text-right">Listened: {listenedDuration.toFixed(0)}s{durPer}</p>
                    </div>
                </section>
                    <PlayerInfo data={data} isVisible={viewMode === 'playlist'} />
                </div>
            </article>
    );
}

export default Player;
