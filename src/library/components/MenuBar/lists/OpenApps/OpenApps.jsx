import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import List from '../../../common/lists/List/List';
import ListItem from '../../../common/lists/List/Item/ListItem';
import Button from '../../../common/sub-components/Button/Button';
import { WindowTypes } from '../../../../redux/reducers/windowOrder';
import store from '../../../../redux/store';
import { changeWindowOrder } from '../../../../redux/actions/windowOrder';
import { getCurrentAccessLevel } from '../../../../redux/selectors/users';
import { AccessLevels } from '../../../../AccessCentral';

import { ReactComponent as Chat } from '../../../../icons/chat.svg';
import { ReactComponent as Map } from '../../../../icons/map.svg';
import { ReactComponent as Wallet } from '../../../../icons/wallet.svg';
import { ReactComponent as File } from '../../../../icons/file.svg';
import { ReactComponent as News } from '../../../../icons/news.svg';
import { ReactComponent as Layers } from '../../../../icons/layers.svg';
import { ReactComponent as Grid } from '../../../../icons/grid.svg';
import { getOrder } from '../../../../redux/selectors/windowOrder';

import './OpenApps.scss';

const OpenApps = () => {
  const order = useSelector(getOrder);
  const accessLevel = useSelector(getCurrentAccessLevel);
  const otherWindows = [];

  const changeOrder = useCallback(({ id, value }) => store.dispatch(changeWindowOrder({ windows: [{ id, value }] })), []);

  order.forEach((value, key) => {
    if (![WindowTypes.CHAT, WindowTypes.NEWS, WindowTypes.DOCFILE, WindowTypes.WORLDMAP, WindowTypes.WALLET].includes(key)) {
      otherWindows.push(
        <ListItem key={key}>
          <Button
            onClick={() => changeOrder({ id: key, value })}
          >
            {key}
          </Button>
        </ListItem>,
      );
    }
  });

  return (
    <div className="OpenApps">
      <List dropdown className="apps" title={<Grid />}>
        <ListItem key="chat">
          <Button
            key="chat"
            className={`${order.get(WindowTypes.CHAT) && order.get(WindowTypes.CHAT).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.CHAT, value: { type: WindowTypes.CHAT } })}
          >
            <Chat />
          </Button>
        </ListItem>
        <ListItem key="news">
          <Button
            key="news"
            className={`${order.get(WindowTypes.NEWS) && order.get(WindowTypes.NEWS).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.NEWS, value: { type: WindowTypes.NEWS } })}
          >
            <News />
          </Button>
        </ListItem>
        <ListItem key="docFile">
          <Button
            key="docFile"
            className={`${order.get(WindowTypes.DOCFILE) && order.get(WindowTypes.DOCFILE).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.DOCFILE, value: { type: WindowTypes.DOCFILE } })}
          >
            <File />
          </Button>
        </ListItem>
        <ListItem key="worldMap">
          <Button
            key="worldMap"
            className={`${order.get(WindowTypes.WORLDMAP) && order.get(WindowTypes.WORLDMAP).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.WORLDMAP, value: { type: WindowTypes.WORLDMAP } })}
          >
            <Map />
          </Button>
        </ListItem>
        {accessLevel >= AccessLevels.STANDARD && (
          <ListItem key="wallet">
            <Button
              key="wallet"
              className={`${order.get(WindowTypes.WALLET) && order.get(WindowTypes.WALLET).index === order.size ? 'active' : ''}`}
              onClick={() => changeOrder({ id: WindowTypes.WALLET, value: { type: WindowTypes.WALLET } })}
            >
              <Wallet />
            </Button>
          </ListItem>
        )}
      </List>
      {otherWindows.length > 0 && (
        <List
          dropdown
          className="otherWindows"
          title={<Layers />}
        >
          {otherWindows}
        </List>
      )}
    </div>
  );
};

export default React.memo(OpenApps);
