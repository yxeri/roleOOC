import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ReactComponent as ClockSvg } from '../../../../icons/clock.svg';
import Button from '../../../common/sub-components/Button/Button';
import { getTimestamp } from '../../../../TextTools';

import './Clock.scss';

const Clock = () => {
  const timeoutRef = useRef();
  const [date, setDate] = useState(new Date());
  const [showTime, setShowTime] = useState(false);
  const timestamp = getTimestamp({ date });

  const updateTime = () => {
    timeoutRef.current = setTimeout(() => {
      setDate(new Date());
      updateTime();
    }, 1000);
  };

  useEffect(() => {
    updateTime();

    return () => clearTimeout(timeoutRef.current);
  }, []);

  const onClick = useCallback(() => setShowTime(!showTime), [showTime]);

  return (
    <div
      key="clock"
      className="Clock"
    >
      <Button className={`icon ${showTime ? 'active' : ''}`} onClick={onClick}><ClockSvg /></Button>
      <Button onClick={onClick} className={`time ${!showTime ? 'hide' : ''}`}>{timestamp.fullTime}</Button>
    </div>
  );
};

export default React.memo(Clock);
