import React, { useCallback } from 'react';
import {
  bool,
  func, node,
  string,
} from 'prop-types';
import { useSelector } from 'react-redux';

import { ReactComponent as Maximize } from '../../../../icons/maximize.svg';
import { ReactComponent as Minimize } from '../../../../icons/minimize.svg';
import { ReactComponent as Close } from '../../../../icons/close.svg';
import { ReactComponent as Help } from '../../../../icons/help.svg';
import Button from '../../sub-components/Button/Button';
import store from '../../../../redux/store';
import { changeMode, changeTarget } from '../../../../redux/actions/mode';
import { Modes } from '../../../../redux/reducers/mode';
import { getSystemConfig } from '../../../../redux/selectors/users';
import { getMode } from '../../../../redux/selectors/mode';

import './TopBar.scss';

const TopBar = ({
  onDoubleClick,
  title,
  done,
  id,
  maximized,
}) => {
  const systemConfig = useSelector(getSystemConfig);
  const mode = useSelector(getMode);

  const onHelp = useCallback(() => {
    if (mode.mode === Modes.HELP && mode.target !== id) {
      store.dispatch(changeTarget({ target: id }));
    } else {
      store.dispatch(changeMode({ mode: Modes.HELP, target: id }));
    }
  }, [mode, id]);

  return (
    <div
      onDoubleClick={onDoubleClick}
      className="TopBar"
    >
      <div className="TopBarHandle">
        <div className="title">{title}</div>
      </div>
      <div className="buttons">
        {!systemConfig.hideHelp && (
          <Button
            stopPropagation
            key="help"
            className={`help ${mode.mode === Modes.HELP && mode.target === id ? 'active' : ''}`}
            type="button"
            onClick={onHelp}
          >
            <Help />
          </Button>
        )}
        {!systemConfig.alwaysMaximized && (
          <Button type="button" onClick={onDoubleClick}>
            {
              maximized
                ? <Minimize />
                : <Maximize />
            }
          </Button>
        )}
        <Button className="close" stopPropagation type="button" onClick={done}><Close /></Button>
      </div>
    </div>
  );
};

export default React.memo(TopBar);

TopBar.propTypes = {
  done: func.isRequired,
  title: node.isRequired,
  onDoubleClick: func.isRequired,
  id: string.isRequired,
  maximized: bool,
};

TopBar.defaultProps = {
  maximized: undefined,
};
