import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AccessLevels } from '../../AccessCentral';
import Wallet from '../Wallet/Wallet';
import WorldMap from '../WorldMap/WorldMap';
import Chat from '../Chat/Chat';
import { getCurrentAccessLevel } from '../../redux/selectors/users';

import './MainWindow.scss';

export const WindowTypes = {
  WALLET: 'wallet',
  CHAT: 'chat',
  WORLDMAP: 'worldMap',
};

export default function MainWindow() {
  const [order, setOrder] = useState(new Set([
    WindowTypes.WALLET,
    WindowTypes.WORLDMAP,
    WindowTypes.CHAT,
  ]));
  const accessLevel = useSelector(getCurrentAccessLevel);
  const content = [];
  const onClick = (type) => {
    const set = new Set(order);

    set.delete(type);
    set.add(type);

    setOrder(set);
  };

  if (accessLevel >= AccessLevels.STANDARD) {
    content.push(<Wallet
      order={[...order.values()].indexOf(WindowTypes.WALLET)}
      onClick={() => onClick(WindowTypes.WALLET)}
    />);
  }

  content.push(<WorldMap
    order={[...order.values()].indexOf(WindowTypes.WORLDMAP)}
    onClick={() => onClick(WindowTypes.WORLDMAP)}
  />);
  content.push(<Chat
    order={[...order.values()].indexOf(WindowTypes.CHAT)}
    onClick={() => onClick(WindowTypes.CHAT)}
  />);

  return (
    <div id="main">
      {content}
    </div>
  );
}
