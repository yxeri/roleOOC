'use strict';

const dbConnector = require('../../databaseConnector');
const manager = require('../../manager');
const dbDefaults = require('../../config/dbPopDefaults');
const logger = require('../../logger');

function handle(socket) {
  socket.on('roomHackable', function(roomName) {
    const roomNameLower = roomName.toLowerCase();

    manager.userAllowedCommand(socket.id, dbDefaults.commands.hackroom.commandName, function(allowErr, allowed, user) {
      if (allowErr || !allowed || !user) {
        logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Unable to hack the room. Something is broken');
        return;
      }

      dbConnector.getRoom(roomNameLower, function(err, room) {
        if (err || room === null || user.accessLevel < room.visibility) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Room is not hackable by you or doesn\'t exist');
          socket.emit('commandFail');
          return;
        }

        socket.emit('commandSuccess');

      });
    });
  });

  socket.on('hackRoom', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.hackroom.commandName, function(allowed) {
      if (allowed) {
        const roomName = data.roomName.toLowerCase();
        const userName = data.userName.toLowerCase();

        dbConnector.addRoomToUser(userName, roomName, function(err) {
          if (err) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to follow the room');
          } else {
            const room = { roomName : roomName };

            socket.join(roomName);
            socket.emit('follow', room);
          }
        });
      }
    });
  });
}

exports.handle = handle;
