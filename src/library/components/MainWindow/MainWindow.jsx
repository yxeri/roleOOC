import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Wallet from '../Wallet/Wallet';
import WorldMap from '../WorldMap/WorldMap';
import Chat from '../Chat/Chat';
import { getOrder } from '../../redux/selectors/windowOrder';
import { WindowTypes } from '../../redux/reducers/windowOrder';
import IdentityDialog from '../common/dialogs/IdentityDialog';
import CreateRoomDialog from '../Chat/dialogs/CreateRoomDialog';
import RemoveRoomDialog from '../Chat/dialogs/RemoveRoomDialog';
import LoginDialog from '../common/dialogs/LoginDialog';
import RegisterDialog from '../common/dialogs/RegisterDialog';
import CreateAliasDialog from '../common/dialogs/CreateAliasDialog';
import CreateTransactionDialog from '../common/dialogs/CreateTransactionDialog';
import DocFile from '../DocFile/DocFile';
import CreateDocFileDialog from '../DocFile/dialogs/CreateDocFile/CreateDocFileDialog';
import Dashboard from './Dashboard/Dashboard';
import News from '../News/News';
import CreateNewsDialog from '../News/dialogs/CreateNewsDialog';
import JoinRoomDialog from '../Chat/dialogs/JoinRoomDialog';
import ConfigSystemDialog from '../common/dialogs/ConfigSystem/ConfigSystemDialog';
import { getSystemConfig } from '../../redux/selectors/users';
import store from '../../redux/store';
import { changeWindowOrder } from '../../redux/actions/windowOrder';
import UnlockDocFileDialog from '../DocFile/dialogs/UnlockDocFileDialog';
import SettingsNewsDialog from '../News/dialogs/SettingsNewsDialog';

import './MainWindow.scss';

const MainWindow = () => {
  const systemConfig = useSelector(getSystemConfig);
  const order = useSelector(getOrder);
  const windows = [];

  useEffect(() => {
    if (systemConfig.openApps && systemConfig.openApps.length > 0) {
      store.dispatch(changeWindowOrder({ windows: systemConfig.openApps.map(({ id, value }) => ({ id, value })) }));
    }
  }, [systemConfig.openApps]);

  order.forEach((value, key) => {
    const { type } = value;

    switch (type) {
      case WindowTypes.CHAT: {
        windows.push(<Chat key={key} id={key} roomId={value.roomId} messageId={value.messageId} index={value.index} />);

        break;
      }
      case WindowTypes.WALLET: {
        windows.push(<Wallet key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.WORLDMAP: {
        windows.push(<WorldMap key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DOCFILE: {
        windows.push(<DocFile key={key} id={key} docFileId={value.docFileId} index={value.index} />);

        break;
      }
      case WindowTypes.NEWS: {
        windows.push(<News key={key} id={key} messageId={value.messageId} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGIDENTITY: {
        windows.push(<IdentityDialog key={key} id={key} identityId={value.identityId} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCREATEROOM: {
        windows.push(<CreateRoomDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGLOGIN: {
        windows.push(<LoginDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGREGISTER: {
        windows.push(<RegisterDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGREMOVEROOM: {
        windows.push(<RemoveRoomDialog key={key} id={key} roomId={value.roomId} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCREATEALIAS: {
        windows.push(<CreateAliasDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCREATETRANSACTION: {
        windows.push(<CreateTransactionDialog key={key} id={key} toWalletId={value.toWalletId} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCREATEDOCFILE: {
        windows.push(<CreateDocFileDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCREATENEWS: {
        windows.push(<CreateNewsDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGJOINROOM: {
        windows.push(<JoinRoomDialog key={key} id={key} roomId={value.roomId} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGCONFIGSYSTEM: {
        windows.push(<ConfigSystemDialog key={key} id={key} index={value.index} />);

        break;
      }
      case WindowTypes.DIALOGUNLOCKROOM: {
        windows.push(<UnlockDocFileDialog key={key} id={key} index={value.index} docFileId={value.docFileId} />);

        break;
      }
      case WindowTypes.DIALOGSETTINGSNEWS: {
        windows.push(<SettingsNewsDialog key={key} id={key} index={value.index} />);

        break;
      }
      default: {
        console.error('Unknown window type', type);

        break;
      }
    }
  });

  return (
    <div
      key="mainWindow"
      id="MainWindow"
    >
      <Dashboard />
      {windows}
    </div>
  );
};

export default React.memo(MainWindow);
