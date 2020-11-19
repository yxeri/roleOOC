import React from 'react';
import { useSelector } from 'react-redux';
import { func, string } from 'prop-types';
import Dialog from './Dialog/Dialog';
import { getIdentity } from '../../../redux/selectors/users';
import Button from '../sub-components/Button/Button';

export default function UserDialog({ userId, done }) {
  const user = useSelector((state) => getIdentity(state, { identityId: userId }));

  return (
    <Dialog
      done={done}
    >
      <Button
        type="button"
        onClick={() => {
          done();
        }}
      >
        Message
      </Button>
    </Dialog>
  );
}

UserDialog.propTypes = {
  done: func.isRequired,
  userId: string.isRequired,
};
