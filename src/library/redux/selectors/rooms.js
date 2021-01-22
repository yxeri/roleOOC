import createCachedSelector from 're-reselect';
import { getCurrentUserIdentities, getCurrentUserRooms, getIdentitiesByIds } from './users';

export const getAllRooms = (state) => state.rooms;

export const getRoomById = (state, { id }) => state.rooms.get(id);

const getRooms = createCachedSelector(
  [getAllRooms],
  (rooms) => [...rooms.values()].filter((room) => !room.isWhisper && !room.isUser),
)(() => 'normalRooms');

export const getWhisperRooms = createCachedSelector(
  [
    getAllRooms,
    (_, { spyMode }) => spyMode,
  ],
  (rooms, spyMode) => [...rooms.values()]
    .filter((room) => room.isWhisper && ((typeof room.spyMode !== 'boolean' && !spyMode) || spyMode === room.spyMode))
    .map(({ objectId, participantIds }) => ({ objectId, participantIds, spyMode })),
)((_, { spyMode }) => `whisperRooms-spy-${spyMode}`);

export const getUnfollowedRoomIds = createCachedSelector(
  [getRooms, getCurrentUserRooms],
  (rooms, followingRooms) => rooms
    .filter((room) => !followingRooms.includes(room.objectId)).map(({ roomName, objectId }) => ({ roomName, objectId }))
    .sort((roomA, roomB) => {
      const a = roomA.roomName.toLowerCase();
      const b = roomB.roomName.toLowerCase();

      if (a > b) {
        return 1;
      }

      if (b < a) {
        return 1;
      }

      return 0;
    })
    .map(({ objectId }) => objectId),
)(() => 'unfollowedRooms');

export const getFollowedRoomsIds = createCachedSelector(
  [getRooms, getCurrentUserRooms],
  (rooms, followingRooms) => rooms
    .filter((room) => followingRooms.includes(room.objectId))
    .map(({ objectId }) => objectId),
)(() => 'followedRooms');

export const getWhisperRoom = createCachedSelector(
  [
    getWhisperRooms,
    (_, { identityId, currentIdentityId }) => ({ identityId, currentIdentityId }),
    (state, { identityId }) => getRoomById(state, { id: identityId }),
  ],
  (rooms, { currentIdentityId, identityId }, identityRoom) => rooms
    .find((room) => room.participantIds.includes(currentIdentityId) && room.participantIds.includes(identityId)) || identityRoom,
)((_, { currentIdentityId, identityId }) => `whisper-${currentIdentityId}-${identityId}`);

export const getWhisperRoomNames = createCachedSelector(
  [
    getIdentitiesByIds,
    getCurrentUserIdentities,
    (_, { ids: participantIds }) => participantIds,
  ],
  (identities, currentIdentities, participantIds) => {
    const participant = identities.get(participantIds[0]);
    const secondParticipant = identities.get(participantIds[1]);
    const isFirst = currentIdentities
      .find(({ objectId }) => participant.objectId === objectId || participant.ownerId === objectId || participant.userIds.includes(objectId));
    const names = [];

    if (!participant || !secondParticipant) {
      return '';
    }

    if (isFirst) {
      names.push(
        participant.username || participant.aliasName,
        secondParticipant.username || secondParticipant.aliasName,
      );
    } else {
      names.push(
        secondParticipant.username || secondParticipant.aliasName,
        participant.username || participant.aliasName,
      );
    }

    return names;
  },
)((_, { ids }) => `w-name-${ids.join(' ')}`);
