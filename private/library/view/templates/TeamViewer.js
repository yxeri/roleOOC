/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const List = require('../base/List');
const StandardView = require('../base/StandardView');
const DialogBox = require('../DialogBox');
const ButtonBox = require('./ButtonBox');
const elementCreator = require('../../ElementCreator');
const socketManager = require('../../SocketManager');
const storageManager = require('../../StorageManager');
const eventCentral = require('../../EventCentral');
const textTools = require('../../TextTools');
const soundLibrary = require('../../audio/SoundLibrary');

/**
 * Hides/shows button depending on if the user is in a team
 * @param {HTMLElement} params.createButton Team create button
 * @param {HTMLElement} params.inviteButton Invite to team button
 * @param {HTMLElement} params.leaveButton Leave team button
 */
function toggleSystemButtons({ createButton, inviteButton, leaveButton }) {
  if (storageManager.getTeam()) {
    createButton.classList.add('hide');
    inviteButton.classList.remove('hide');
    leaveButton.classList.remove('hide');
  } else {
    createButton.classList.remove('hide');
    inviteButton.classList.add('hide');
    leaveButton.classList.add('hide');
  }
}

class TeamViewer extends StandardView {
  constructor({ isFullscreen, worldMap }) {
    super({ isFullscreen, viewId: 'teamViewer' });

    this.worldMap = worldMap;
    this.viewer.classList.add('selectedView');
    this.selectedItem = null;

    this.systemList = new List({
      shouldSort: false,
      title: 'SYSTEM',
    });
    this.userList = new List({
      viewId: 'teamUsers',
      shouldSort: true,
      title: 'Members',
    });
    this.userViewerList = new List({
      viewId: 'teamViewerUsers',
      shouldSort: false,
      title: 'Members',
    });
    this.invitationList = new List({
      viewId: 'teamInvitations',
      shouldSort: false,
      title: 'Invitations',
      showingList: true,
    });

    this.populateList();
  }

  /**
   * Create invitation paragraph, with accept/deny buttons
   * @param {Object} invitation Invitation
   * @returns {Element} Invitation paragraph
   */
  createInvitationParagraph({ invitation }) {
    const paragraph = document.createElement('P');
    paragraph.classList.add('invitationItem');
    paragraph.appendChild(elementCreator.createButton({
      text: 'Accept',
      func: () => {
        socketManager.emitEvent('acceptTeamInvitation', { invitation }, ({ error, data }) => {
          const description = [];

          if (error) {
            description.push('Something went wrong');
            description.push('Unable to join project group');

            return;
          }

          const { teamName, shortName } = data.team;

          storageManager.setTeam(teamName, shortName);

          eventCentral.triggerEvent({ event: eventCentral.Events.TEAM, params: { team: data.team } });
          eventCentral.triggerEvent({ event: eventCentral.Events.FOLLOWROOM, params: { room: data.room } });

          this.invitationList.replaceAllItems({ items: [] });

          description.push(`You have accepted the invitation to join project group ${invitation.itemName}`);

          const acceptBox = new ButtonBox({
            description,
            buttons: [
              elementCreator.createButton({
                text: 'Confirmed',
                func: () => {
                  acceptBox.removeView();
                },
              }),
            ],
          });

          acceptBox.appendTo(this.element.parentElement);
        });
      },
    }));
    paragraph.appendChild(elementCreator.createButton({
      text: 'Decline',
      func: () => {
        socketManager.emitEvent('declineTeamInvitation', { invitation }, ({ error }) => {
          if (error) {
            return;
          }

          const declineBox = new ButtonBox({
            description: [`You have declined the invitation to join project group ${invitation.itemName}`],
            buttons: [
              elementCreator.createButton({
                text: 'Confirmed',
                func: () => {
                  paragraph.remove();
                  declineBox.removeView();
                },
              }),
            ],
          });

          declineBox.appendTo(this.element.parentElement);
        });
      },
    }));
    paragraph.appendChild(elementCreator.createSpan({ text: `Invitation to ${invitation.itemName} from ${invitation.sender}` }));

    return paragraph;
  }

  createMemberButton({ user }) {
    return elementCreator.createButton({
      text: user.userName,
      func: () => {
        console.log(this.selectedItem);
      },
    });
  }

  populateList() {
    const createButton = elementCreator.createButton({
      text: 'Create a project team',
      classes: ['hide'],
      func: () => {
        const createDialog = new DialogBox({
          buttons: {
            left: {
              text: 'Cancel',
              eventFunc: () => { createDialog.removeView(); },
            },
            right: {
              text: 'Create',
              eventFunc: () => {
                const team = {
                  teamName: createDialog.inputs.find(input => input.inputName === 'teamName').inputElement.value,
                  shortName: createDialog.inputs.find(input => input.inputName === 'shortName').inputElement.value.toUpperCase(),
                };

                if (createDialog.markEmptyFields()) {
                  soundLibrary.playSound('fail');
                  createDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                } else if (!textTools.isInternationalAllowed(team.shortName)) {
                  const shortNameInput = createDialog.inputs.find(input => input.inputName === 'shortName').inputElement;

                  shortNameInput.classList.add('markedInput');
                  shortNameInput.setAttribute('placeholder', 'Has to be alphanumerical (a-z, 0-9)');
                  shortNameInput.value = '';

                  return;
                }

                socketManager.emitEvent('createTeam', { team }, ({ error, data }) => {
                  if (error) {
                    console.log(error);

                    return;
                  }

                  createDialog.removeView();

                  if (data.requiresVerify) {
                    const verifyDialog = new ButtonBox({
                      description: [
                        'Your project team needs to be verified before you can access it',
                        'Contact an administrator',
                      ],
                      buttons: [
                        elementCreator.createButton({
                          text: 'Understood',
                          func: () => { verifyDialog.removeView(); },
                        }),
                      ],
                    });

                    verifyDialog.appendTo(this.element.parentElement);
                  } else {
                    storageManager.setTeam(team.teamName, team.shortName);
                    eventCentral.triggerEvent({ event: eventCentral.Events.TEAM, params: { team } });
                  }
                });
              },
            },
          },
          inputs: [{
            placeholder: 'Project team name',
            inputName: 'teamName',
            isRequired: true,
            maxLength: 20,
          }, {
            placeholder: 'Short name/Acronym',
            inputName: 'shortName',
            isRequired: true,
            maxLength: 6,
          }],
          description: ['Create a project team team'],
          extraDescription: ['Input full and short name. Short name will be automatically capitalized'],
        });
        createDialog.appendTo(this.element.parentElement);
      },
    });
    const inviteButton = elementCreator.createButton({
      text: 'Invite user',
      classes: ['hide'],
      func: () => {
        const inviteDialog = new DialogBox({
          buttons: {
            left: {
              text: 'Cancel',
              eventFunc: () => { inviteDialog.removeView(); },
            },
            right: {
              text: 'Invite',
              eventFunc: () => {
                const to = inviteDialog.inputs.find(input => input.inputName === 'userName').inputElement.value.toLowerCase();

                if (inviteDialog.markEmptyFields()) {
                  soundLibrary.playSound('fail');
                  inviteDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                }

                socketManager.emitEvent('inviteToTeam', { to }, ({ error }) => {
                  if (error) {
                    const dialog = new ButtonBox({
                      buttons: [
                        elementCreator.createButton({
                          text: 'I understand',
                          func: () => { dialog.removeView(); },
                        }),
                      ],
                    });

                    switch (error.type) {
                      case 'not allowed': {
                        dialog.changeDescription({ text: ['You do not have permission to add members to the team'] });

                        break;
                      }
                      case 'already exists': {
                        dialog.changeDescription({ text: [`${to} has already been invited to the team`] });

                        break;
                      }
                      default: {
                        dialog.changeDescription({ text: [`Unable to invite ${to} to the team`] });

                        break;
                      }
                    }

                    inviteDialog.removeView();
                    dialog.appendTo(this.element.parentElement);

                    return;
                  }

                  const dialog = new ButtonBox({
                    description: [`An invitation has been sent to ${to}`],
                    buttons: [
                      elementCreator.createButton({
                        text: 'I understand',
                        func: () => { dialog.removeView(); },
                      }),
                    ],
                  });

                  inviteDialog.removeView();
                  dialog.appendTo(this.element.parentElement);
                });
              },
            },
          },
          inputs: [{
            placeholder: 'User name',
            inputName: 'userName',
            isRequired: true,
          }],
          description: ['Invite a user to your team'],
          extraDescription: [''],
        });

        inviteDialog.appendTo(this.element.parentElement);
      },
    });
    const leaveButton = elementCreator.createButton({
      text: 'Leave team',
      classes: ['hide'],
      func: () => {
        socketManager.emitEvent('getTeam', {}, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { team } = data;
          const description = [];

          if (team.owner === storageManager.getUserName()) {
            description.push('WARNING', 'You are the owner of the team. The whole team will be DELETED if you leave it', 'Are you sure that you want to proceed?');
          } else {
            description.push('You are trying to leave the team', 'Are you sure that you want to proceed?');
          }

          const leaveDialog = new DialogBox({
            description,
            buttons: {
              left: {
                text: 'Cancel',
                eventFunc: () => {
                  leaveDialog.removeView();
                },
              },
              right: {
                text: 'Leave',
                eventFunc: () => {
                  socketManager.emitEvent('leaveTeam', {}, ({ error: leaveError, data: leaveData }) => {
                    if (leaveError) {
                      leaveDialog.changeExtraDescription({ text: ['Something went wrong', 'Failed to leave the team'] });

                      return;
                    }

                    leaveDialog.removeView();
                    eventCentral.triggerEvent({ event: eventCentral.Events.UNFOLLOWROOM, params: { room: leaveData.room } });
                    eventCentral.triggerEvent({ event: eventCentral.Events.TEAM, params: {} });
                  });
                },
              },
            },
          });

          leaveDialog.appendTo(this.element.parentElement);
        });
      },
    });

    this.systemList.addItems({ items: [createButton, inviteButton, leaveButton] });

    this.viewer.appendChild(this.invitationList.element);
    this.viewer.appendChild(this.userViewerList.element);
    this.itemList.appendChild(this.systemList.element);
    this.itemList.appendChild(this.userList.element);

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.USER,
      func: ({ changedUser }) => {
        const teamName = storageManager.getTeam();
        const shortTeam = storageManager.getShortTeam();

        if (changedUser) {
          this.invitationList.replaceAllItems({ items: [] });
          this.userList.replaceAllItems({ items: [] });
          this.userViewerList.replaceAllItems({ items: [] });
        }

        if (storageManager.getToken()) {
          socketManager.emitEvent('getTeamInvitations', {}, ({ error, data }) => {
            if (error) {
              return;
            }

            this.invitationList.replaceAllItems({ items: data.invitations.map(invitation => this.createInvitationParagraph({ invitation })) });
          });
        }

        toggleSystemButtons({ createButton, inviteButton, leaveButton });
        eventCentral.triggerEvent({ event: eventCentral.Events.TEAM, params: { team: { teamName, shortName: shortTeam } } });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.INVITATION,
      func: ({ invitation }) => {
        if (invitation.invitationType !== 'team') {
          return;
        }

        this.invitationList.addItem({ item: this.createInvitationParagraph({ invitation }) });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.NEWMEMBER,
      func: ({ user }) => {
        this.userList.addItem({ item: this.createMemberButton({ user }) });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.TEAM,
      func: ({ team }) => {
        if (team && team.teamName) {
          socketManager.emitEvent('listUsers', { team: { teamName: team.teamName, shouldEqual: true } }, ({ error, data }) => {
            if (error) {
              console.log(error);

              return;
            }

            const users = data.users;

            this.userList.replaceAllItems({
              items: users.map(user => this.createMemberButton({ user })),
            });

            if (this.worldMap) {
              const teamPings = Object.keys(this.worldMap.markers).filter((positionName) => {
                const marker = this.worldMap.markers[positionName];

                return marker.markerType === 'ping' && users.map(user => user.userName).indexOf(marker.owner) > -1;
              });
              const listItems = teamPings.map((ping) => {
                const beautifiedDate = textTools.generateTimeStamp({ date: ping.lastUpdated });

                return elementCreator.createSpan({ text: `${beautifiedDate.fullDate} ${beautifiedDate.fullTime} ${ping.positionName}` });
              });

              this.userViewerList.replaceAllItems({ items: listItems });
            }
          });
        } else {
          storageManager.removeTeam();
          this.userList.replaceAllItems({ items: [] });
          this.userViewerList.replaceAllItems({ items: [] });
        }

        toggleSystemButtons({ createButton, inviteButton, leaveButton });
      },
    });
  }
}

module.exports = TeamViewer;
