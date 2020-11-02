import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { arrayOf, element } from 'prop-types';
import {
  ALIASES,
  DOCFILES,
  FORUMPOSTS,
  FORUMS,
  FORUMTHREADS,
  GAMECODES,
  INVITATIONS,
  MESSAGES,
  ROOMS,
  SIMPLEMSGS,
  TEAMS,
  TRANSACTIONS,
  USERS,
  WALLETS,
  DEVICES,
  CONFIG,
  ONLINE,
} from '../redux/actionTypes';
import {
  emitSocketEvent,
  addSocketListener,
  GetEvents,
  EmitTypes,
  reconnect,
} from '../SocketManager';
import { ChangeTypes } from '../redux/reducers/root';
import { getUserId } from '../redux/selectors/userId';
import { Status } from '../redux/reducers/online';

export default function DataHandler({ children }) {
  const dispatch = useDispatch();
  const userId = useSelector(getUserId);

  function retrieveAll({ reset } = {}) {
    [
      { type: USERS, event: GetEvents.USERS },
      { type: ALIASES, event: GetEvents.ALIASES },
      { type: MESSAGES, event: GetEvents.MESSAGES },
      { type: ROOMS, event: GetEvents.ROOMS },
      { type: INVITATIONS, event: GetEvents.INVITATIONS },
      { type: DOCFILES, event: GetEvents.DOCFILES },
      { type: FORUMS, event: GetEvents.FORUMS },
      { type: FORUMPOSTS, event: GetEvents.FORUMPOSTS },
      { type: FORUMTHREADS, event: GetEvents.FORUMTHREADS },
      { type: GAMECODES, event: GetEvents.GAMECODES },
      { type: SIMPLEMSGS, event: GetEvents.SIMPLEMSGS },
      { type: TEAMS, event: GetEvents.TEAMS },
      { type: TRANSACTIONS, event: GetEvents.TRANSACTIONS },
      { type: WALLETS, event: GetEvents.WALLETS },
      { type: DEVICES, event: GetEvents.DEVICES },
    ].forEach((getter) => {
      const { event, type } = getter;

      emitSocketEvent(event, {}, ({ error, data }) => {
        if (error) {
          console.log(error);

          return;
        }

        dispatch({
          type,
          payload: {
            reset,
            changeType: ChangeTypes.CREATE,
            [type]: data[type],
          },
        });
      });
    });
  }

  useEffect(() => {
    retrieveAll({ reset: true });
  }, [userId]);

  return (<>{children}</>);
}

DataHandler.propTypes = {
  children: arrayOf(element).isRequired,
};
