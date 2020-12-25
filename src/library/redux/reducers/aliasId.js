import { ALIASID } from '../actionTypes';

const initialState = null;

export default function aliasIdReducer(state = initialState, action) {
  if (action.type === ALIASID) {
    const { payload } = action;
    const { reset, aliasId } = payload;

    return reset
      ? initialState
      : aliasId;
  }

  return state;
}
