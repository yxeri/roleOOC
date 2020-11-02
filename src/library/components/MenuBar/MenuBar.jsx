import React from 'react';
import { useSelector } from 'react-redux';
import Clock from './sub-components/Clock';
import MainList from './lists/MainList';
import { isOnline } from '../../redux/selectors/online';

import './MenuBar.scss';

const MenuBar = () => {
  const online = useSelector(isOnline);
  const content = [];

  return (
    <div
      className={`${!online ? 'warning' : ''}`}
      id="menuBar"
    >
      <MainList />
      {content}
      <Clock />
    </div>
  );
};

export default MenuBar;
