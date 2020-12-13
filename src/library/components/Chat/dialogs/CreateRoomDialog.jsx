import React, { useState } from 'react';
import { func } from 'prop-types';
import Dialog from '../../common/dialogs/Dialog/Dialog';
import Input from '../../common/sub-components/Input';
import { emitSocketEvent } from '../../../socket/SocketManager';
import Button from '../../common/sub-components/Button/Button';

const CreateRoomDialog = ({ done }) => {
  const [roomName, setRoomName] = useState();
  const [password, setPassword] = useState();
  const [repeatPassword, setRepeatPassword] = useState();
  const [topic, setTopic] = useState();
  const [error, setError] = useState();

  const onSubmit = () => {
    if (!roomName) {
      return;
    }

    if (password && password !== repeatPassword) {
      return;
    }

    const room = {
      roomName,
      password,
      topic,
    };

    emitSocketEvent('createRoom', { room }, ({ error: roomError }) => {
      if (roomError) {
        setError(roomError);

        return;
      }

      // TODO Notification: Room created

      done();
    });
  };

  return (
    <Dialog
      classNames={['CreateRoomDialog']}
      done={done}
      error={error}
      title="New room"
    >
      <Input
        required
        onChange={setRoomName}
        placeholder="Name of the room"
      />
      <Input
        onChange={setTopic}
        placeholder="Topic (shown when joining the room)"
      />
      <Input
        onChange={setPassword}
        type="password"
        placeholder="Password"
      />
      <Input
        onChange={setRepeatPassword}
        type="password"
        placeholder="Repeat password"
      />
      <div className="buttons">
        <Button
          type="submit"
          onClick={onSubmit}
        >
          Create
        </Button>
      </div>
    </Dialog>
  );
};

export default React.memo(CreateRoomDialog);

CreateRoomDialog.propTypes = {
  done: func.isRequired,
};
