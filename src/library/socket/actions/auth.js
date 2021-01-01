import store from '../../redux/store';
import { login as loginAction, logout as logoutAction } from '../../redux/actions/auth';
import { ActionEvents, emitSocketEvent, retrieveAll } from '../SocketManager';

export const login = async (username, password) => {
  const result = await emitSocketEvent(ActionEvents.LOGIN, { user: { username, password } });

  const { user, token } = result;

  store.dispatch(loginAction({ userId: user.objectId, token, retrieveAll }));

  return result;
};

export const logout = async () => {
  store.dispatch(logoutAction(retrieveAll));
};
