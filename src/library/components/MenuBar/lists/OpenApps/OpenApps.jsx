import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import List from '../../../common/lists/List/List';
import ListItem from '../../../common/lists/List/Item/ListItem';
import Button from '../../../common/sub-components/Button/Button';
import { WindowTypes } from '../../../../redux/reducers/windowOrder';
import store from '../../../../redux/store';
import { changeWindowOrder } from '../../../../redux/actions/windowOrder';
import { getCurrentAccessLevel, getIdentityOrTeamName } from '../../../../redux/selectors/users';
import { AccessLevels } from '../../../../AccessCentral';

import { ReactComponent as Chat } from '../../../../icons/chat.svg';
import { ReactComponent as Map } from '../../../../icons/map.svg';
import { ReactComponent as Wallet } from '../../../../icons/wallet.svg';
import { ReactComponent as File } from '../../../../icons/file.svg';
import { ReactComponent as Files } from '../../../../icons/files.svg';
import { ReactComponent as News } from '../../../../icons/news.svg';
import { ReactComponent as Layers } from '../../../../icons/layers.svg';
import { ReactComponent as Apps } from '../../../../icons/apps.svg';
import { ReactComponent as Users } from '../../../../icons/users.svg';
import { ReactComponent as Team } from '../../../../icons/team.svg';
import { ReactComponent as Terminal } from '../../../../icons/terminal.svg';
import { ReactComponent as Heart } from '../../../../icons/heart.svg';
import { ReactComponent as Wrecking } from '../../../../icons/wrecking.svg';
import { ReactComponent as User } from '../../../../icons/user.svg';
import { getOrder } from '../../../../redux/selectors/windowOrder';
import { getDocFileById } from '../../../../redux/selectors/docFiles';

import './OpenApps.scss';

const OpenApps = () => {
  const order = useSelector(getOrder);
  const accessLevel = useSelector(getCurrentAccessLevel);
  const otherWindows = [];

  const changeOrder = useCallback(({ id, value }) => store.dispatch(changeWindowOrder({ windows: [{ id, value }] })), []);

  order.forEach((value, key) => {
    if (![WindowTypes.CHAT, WindowTypes.NEWS, WindowTypes.DOCFILEDIR, WindowTypes.WORLDMAP, WindowTypes.WALLET].includes(key)) {
      let title;
      let icon;

      switch (value.type) {
        case WindowTypes.DIALOGPROFILE: {
          icon = <User />;

          if (!value.identityId) {
            title = 'Your profile';
          } else {
            title = getIdentityOrTeamName(store.getState(), { id: value.identityId }).name;
          }

          break;
        }
        case WindowTypes.DOCFILEVIEW: {
          icon = <File />;
          title = getDocFileById(store.getState(), { id: value.docFileId }).title;

          break;
        }
        default: {
          icon = <Layers />;
          title = key;

          break;
        }
      }

      otherWindows.push(
        <ListItem
          className="other"
          key={key}
        >
          <Button
            onClick={() => changeOrder({ id: key, value })}
          >
            {icon}
          </Button>
          <span>{title}</span>
        </ListItem>,
      );
    }
  });

  return (
    <div className="OpenApps">
      <List
        dropdown
        className="apps"
        title={<Apps />}
      >
        <ListItem key="chat">
          <Button
            key="chat"
            className={`${order.get(WindowTypes.CHAT) && order.get(WindowTypes.CHAT).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.CHAT, value: { type: WindowTypes.CHAT } })}
          >
            <Chat />
          </Button>
          <span>Chat</span>
        </ListItem>
        <ListItem key="news">
          <Button
            key="news"
            className={`${order.get(WindowTypes.NEWS) && order.get(WindowTypes.NEWS).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.NEWS, value: { type: WindowTypes.NEWS } })}
          >
            <News />
          </Button>
          <span>News</span>
        </ListItem>
        <ListItem key="docFile">
          <Button
            key="docFile"
            className={`${order.get(WindowTypes.DOCFILEDIR) && order.get(WindowTypes.DOCFILEDIR).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.DOCFILEDIR, value: { type: WindowTypes.DOCFILEDIR } })}
          >
            <Files />
          </Button>
          <span>Files</span>
        </ListItem>
        {/*<ListItem key="worldMap">*/}
        {/*  <Button*/}
        {/*    key="worldMap"*/}
        {/*    className={`${order.get(WindowTypes.WORLDMAP) && order.get(WindowTypes.WORLDMAP).index === order.size ? 'active' : ''}`}*/}
        {/*    onClick={() => changeOrder({ id: WindowTypes.WORLDMAP, value: { type: WindowTypes.WORLDMAP } })}*/}
        {/*  >*/}
        {/*    <Map />*/}
        {/*  </Button>*/}
        {/*  <span>Map</span>*/}
        {/*</ListItem>*/}
        {accessLevel >= AccessLevels.STANDARD && (
          <ListItem key="wallet">
            <Button
              key="wallet"
              className={`${order.get(WindowTypes.WALLET) && order.get(WindowTypes.WALLET).index === order.size ? 'active' : ''}`}
              onClick={() => changeOrder({ id: WindowTypes.WALLET, value: { type: WindowTypes.WALLET } })}
            >
              <Wallet />
            </Button>
            <span>Wallet</span>
          </ListItem>
        )}
        <ListItem key="identities">
          <Button
            key="identities"
            className={`${order.get(WindowTypes.IDENTITIES) && order.get(WindowTypes.IDENTITIES).index === order.size ? 'active' : ''}`}
            onClick={() => changeOrder({ id: WindowTypes.IDENTITIES, value: { type: WindowTypes.IDENTITIES } })}
          >
            <Users />
          </Button>
          <span>Users</span>
        </ListItem>
        <ListItem
          className="faded"
          key="teams"
        >
          <Button
            key="Teams"
            onClick={() => {}}
          >
            <Team />
          </Button>
          <span>Teams</span>
        </ListItem>
        <ListItem
          className="faded"
          key="terminal"
        >
          <Button
            key="terminal"
            onClick={() => {}}
          >
            <Terminal />
          </Button>
          <span>Terminal</span>
        </ListItem>
        <ListItem
          key="wrecking"
          className="faded"
        >
          <Button
            key="wrecking"
            onClick={() => {}}
          >
            <Wrecking />
          </Button>
          <span>Wrecker Central</span>
        </ListItem>
        {/*<ListItem*/}
        {/*  className="faded"*/}
        {/*  key="love"*/}
        {/*>*/}
        {/*  <Button*/}
        {/*    key="love"*/}
        {/*    onClick={() => {}}*/}
        {/*  >*/}
        {/*    <Heart />*/}
        {/*  </Button>*/}
        {/*  <span>Love Bureau</span>*/}
        {/*</ListItem>*/}
        {otherWindows}
      </List>
    </div>
  );
};

export default React.memo(OpenApps);
