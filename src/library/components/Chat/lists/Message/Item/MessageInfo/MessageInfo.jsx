import React from 'react';
import { useSelector } from 'react-redux';
import { string } from 'prop-types';

import { getIdentityOrTeamName } from '../../../../../../redux/selectors/users';
import { getDayModification, getYearModification } from '../../../../../../redux/selectors/config';
import store from '../../../../../../redux/store';
import { changeWindowOrder } from '../../../../../../redux/actions/windowOrder';
import { WindowTypes } from '../../../../../../redux/reducers/windowOrder';
import { getTimestamp } from '../../../../../../TextTools';

import './MessageInfo.scss';

const MessageInfo = ({ identityId, timeCreated }) => {
  const { name } = useSelector((state) => getIdentityOrTeamName(state, { id: identityId }));
  const dayModification = useSelector(getDayModification);
  const yearModification = useSelector(getYearModification);
  const timestamp = getTimestamp({ date: timeCreated, dayModification, yearModification });

  return (
    <p className="MessageInfo">
      <span
        role="button"
        tabIndex={0}
        className="clickable username"
        onClick={(event) => {
          if (name) {
            store.dispatch(changeWindowOrder({
              windows: [{
                id: `${WindowTypes.DIALOGPROFILE}-${identityId}`,
                value: {
                  identityId,
                  type: WindowTypes.DIALOGPROFILE,
                },
              }],
            }));
          }

          event.stopPropagation();
        }}
      >
        {name || '-'}
      </span>
      <span className="time">
        {timestamp.fullStamp}
      </span>
    </p>
  );
};

export default React.memo(MessageInfo);

MessageInfo.propTypes = {
  identityId: string.isRequired,
  timeCreated: string.isRequired,
};
