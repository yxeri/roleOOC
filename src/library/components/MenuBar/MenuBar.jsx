import React from 'react';
import { useSelector } from 'react-redux';
import Clock from './sub-components/Clock';
import MainList from './lists/MainList';
import { isOnline } from '../../redux/selectors/online';

import './MenuBar.scss';
import OpenApps from './lists/OpenApps/OpenApps';

const MenuBar = () => {
  const online = useSelector(isOnline);
  const content = [];
  const classes = [];

  if (!online) {
    classes.push('warning');
  }

  return (
    <div
      className={`${classes.join(' ')}`}
      id="MenuBar"
    >
      <MainList />
      <OpenApps />
      {content}
      <div className="rightAligned">
        <Clock />
      </div>
    </div>
  );
};

export default React.memo(MenuBar);
