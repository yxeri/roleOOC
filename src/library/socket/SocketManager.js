import store from '../redux/store';
import { isOnline, isReconnecting } from '../redux/selectors/online';
import {
  offline,
  online,
  startup,
} from '../redux/actions/online';
import {
  getDeviceId,
  setDeviceId,
  getToken as getStoredToken,
  getUserId as getStoredUserId,
} from '../StorageManager';
import {
  logout as logoutAction,
  login as loginAction,
} from '../redux/actions/auth';
import { getUserId } from '../redux/selectors/userId';
import { chatMessage, chatMessages } from './listeners/messages';
import { room } from './listeners/rooms';
import { user } from './listeners/users';

const socket = (() => {
  let socketUri = typeof ioUri !== 'undefined' // eslint-disable-line no-undef
    ? ioUri // eslint-disable-line no-undef
    : '/';

  if (process.env.NODE_ENV === 'development') {
    socketUri = `${window.location.hostname}:8888`;
  }

  console.log(socketUri);

  return window.io(socketUri, { forceNew: true });
})();

export const SendEvents = {
  ALIAS: 'createAlias',
  USER: 'createUser',
  MESSAGE: 'sendMessage',
  ROOM: 'createRoom',
  INVITATION: 'createInvitation',
  DOCFILE: 'createDocFile',
  FORUM: 'createForum',
  FORUMPOST: 'createForumPost',
  FORUMTHREAD: 'createForumThread',
  GAMECODE: 'createGameCode',
  SIMPLEMSG: 'sendSimpleMsg',
  TEAM: 'createTeam',
  TRANSACTION: 'createTransaction',
  DEVICE: 'createDevice',
  FOLLOW: 'followRoom',
};

export const GetEvents = {
  ALIASES: 'getAliases',
  USERS: 'getUsers',
  MESSAGES: 'getMessages',
  ROOMS: 'getRooms',
  INVITATIONS: 'getInvitations',
  DOCFILES: 'getDocFiles',
  FORUMS: 'getForums',
  FORUMPOSTS: 'getForumPosts',
  FORUMTHREADS: 'getForumThreads',
  GAMECODES: 'getGameCodes',
  SIMPLEMSGS: 'getSimpleMsgs',
  TEAMS: 'getTeams',
  TRANSACTIONS: 'getTransactions',
  WALLETS: 'getWallets',
  DEVICES: 'getDevices',
};

export const ActionEvents = {
  LOGIN: 'login',
};

export const ListenerEvents = {
  RECONNECT: 'reconnect',
  STARTUP: 'startup',
  DISCONNECT: 'disconnect',
  MSGCHAT: 'chatMsg',
  MSGWHISPER: 'whisper',
};

// export const EmitTypes = {
//   FORUM: 'forum',
//   FORUMTHREAD: 'forumThread',
//   FORUMPOST: 'forumPost',

//   DEVICE: 'device',
//   DOCFILE: 'docFile',

//   BROADCAST: 'broadcast',
//   GAMECODE: 'gameCode',
//   ALIAS: 'alias',
//   CREATEPOSITION: 'createPosition',
//   POSITION: 'position',

//   TEAM: 'team',
//   INVITATION: 'invitation',
//   TEAMMEMBER: 'team member',
//   LOGOUT: 'logout',
//   BAN: 'ban',
//   WALLET: 'wallet',
//   TRANSACTION: 'transaction',
//   TEAMSCORING: 'teamScoring',
//   TERMINATE: 'terminate',
//   SENDMSG: 'sendMessage',
//   UPDATEPOSITION: 'updatePosition',
//   UPDATEPOSITIONCOORDINATES: 'updatePositionCoordinates',
//   UNLOCKDOCFILE: 'unlockDocFile',
//   GETROOMMSGS: 'getMessagesByRoom',
//   BANUSER: 'banUser',
//   UNBANUSER: 'unbanUser',
//   VERIFYUSER: 'verifyUser',
//   CHANGEPASSWORD: 'changePassword',
//   UPDATEUSER: 'updateUser',
//   UPDATEWALLET: 'updateWallet',
//   UNFOLLOW: 'unfollowRoom',
//   CREATETRANSACTION: 'createTransaction',
//   INVITETEAM: 'inviteToTeam',
//   LEAVETEAM: 'leaveTeam',
//   SIMPLEMSG: 'simpleMsg',
//   INVITEROOM: 'inviteToRoom',
//   DECLINEINVITE: 'decline',
//   ACCEPTTEAM: 'acceptTeamInvitation',
//   ACCEPTROOM: 'acceptRoomInvitation',
//   SENDROOMINVITE: 'sendInvitationToRoom',
//   GETUSERBYCODE: 'getUserByCode',
//   USEGAMECODE: 'useGameCode',
//   CONNECTUSER: 'connectUser',
// };

export const addSocketListener = async ({ event, callback }) => {
  socket.on(event, (params) => { console.log(event, params); callback(params); });
};

export const reconnect = () => {
  if (!isReconnecting(store.getState())) {
    socket.disconnect();
    socket.connect();
  }
};

/**
 * Emit event through socket.io.
 * @param {string} event Event to emit.
 * @param {Object} [params] Parameters to send in the emit.
 */
export const emitSocketEvent = async (event, params = {}) => {
  return new Promise((resolve, reject) => {
    const paramsToSend = params;
    paramsToSend.token = getStoredToken();

    if (!isOnline(store.getState())) {
      reconnect();
    }

    socket.emit(event, paramsToSend, ({ error, data }) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    emitSocketEvent('ping').catch(() => {
      console.log('ping failed');
    });
  }, 1000);
}

addSocketListener({
  event: ListenerEvents.RECONNECT,
  callback: () => {
    if (getUserId(store.getState)) {
      emitSocketEvent('updateId', {})
        .then(() => {
          store.dispatch(online());
        })
        .catch((error) => {
          console.log(error);
          store.dispatch(logoutAction());
        });
    }
  },
});

addSocketListener({
  event: ListenerEvents.STARTUP,
  callback: ({ data }) => {
    const userId = getStoredUserId();
    const token = getStoredToken();

    if (userId && token) {
      store.dispatch(loginAction({
        userId,
        token,
      }));
    }

    if (!getDeviceId()) {
      setDeviceId('1234567890123456');
    }

    store.dispatch(startup(data));

    if (userId || token) {
      emitSocketEvent('updateId', {})
        .then(() => {
          store.dispatch(online());
        })
        .catch((error) => {
          console.log(error);
          store.dispatch(logoutAction());
        });
    }
  },
});

addSocketListener({
  event: ListenerEvents.DISCONNECT,
  callback: () => {
    store.dispatch(offline());

    reconnect();
  },
});

addSocketListener(chatMessage());
addSocketListener(chatMessages());

addSocketListener(room());

addSocketListener(user());
