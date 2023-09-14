import React, {Fragment} from 'react';
import StatusCardSkeleton, {StatusCardSkeletonData} from "./StatusCardSkeleton";
import SkeletonParagraph from "../skeleton/SkeletonParagraph";
import {clientAdapter} from "../../status/ducks";
import {RootState} from "../../store";
import {connect, ConnectedProps} from "react-redux";
import {Link} from "react-router-dom";

export interface ClientStatusCardData extends StatusCardSkeletonData, PropsFromRedux {
    loading?: boolean
    key: any
}

const ClientStatusCard = (props: ClientStatusCardData) => {
    const {
        loading = false,
        data,
        data: {
            name,
            type,
            display,
            status
        } = {}
    } = props;
    let header: string | undefined = display;
    let body = <SkeletonParagraph/>;
    if(data !== undefined) {
        const {
            hasAuth,
            name,
            type,
            authed,
            initialized
        } = data;
        if(type === 'lastfm' || type === 'listenbrainz')
        header = `${display} (Client)`;

        const scrobbled = initialized && (!hasAuth || (hasAuth && authed)) ? <Link to={`/scrobbled?type=${type}&name=${name}`}>Tracks Scrobbled</Link> : <span>Tracks Scrobbled</span>

        // TODO links
        body = (<Fragment>
            <div>{scrobbled}: {data.tracksDiscovered}</div>
            {hasAuth ? <a target="_blank" href={`/api/client/auth?name=${name}&type=${type}`}>(Re)authenticate or initialize</a> : null}
        </Fragment>);
    }
    return (
        <StatusCardSkeleton loading={loading} title={header} subtitle={name} status={status}>
                {body}
        </StatusCardSkeleton>
    );
}

const simpleSelectors = clientAdapter.getSelectors();

const mapStateToProps = (state: RootState, props) => ({
    data: simpleSelectors.selectById(state.clients, props.id)
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>

export default connector(ClientStatusCard);
