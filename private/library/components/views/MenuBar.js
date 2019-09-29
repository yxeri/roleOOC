/*
 Copyright 2018 Carmilla Mina Jankovic

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

const BaseView = require('./BaseView');
const LoginDialog = require('../../components/views/dialogs/LoginDialog');
const RegisterDialog = require('../../components/views/dialogs/RegisterDialog');
const CurrentUserList = require('../../components/lists/CurrentUserList');
const AliasDialog = require('../../components/views/dialogs/AliasDialog');
const RoomDialog = require('../../components/views/dialogs/RoomDialog');
const DocFileDialog = require('../../components/views/dialogs/DocFileDialog');
const OpenDocFileDialog = require('../../components/views/dialogs/OpenDocFileDialog');
// const VerifyDialog = require('../../components/views/dialogs/VerifyDialog');
const TeamCreateDialog = require('../../components/views/dialogs/TeamCreateDialog');
// const TeamDialog = require('../../components/views/dialogs/TeamDialog');
const UserSelfDialog = require('../../components/views/dialogs/UserSelfDialog');
const WalletInfo = require('../../components/views/WalletInfo');

const elementCreator = require('../../ElementCreator');
const textTools = require('../../TextTools');
const labelHandler = require('../../labels/LabelHandler');
const accessCentral = require('../../AccessCentral');
const socketManager = require('../../SocketManager');
const eventCentral = require('../../EventCentral');
const storageManager = require('../../StorageManager');
const aliasComposer = require('../../data/composers/AliasComposer');
const userComposer = require('../../data/composers/UserComposer');
// const teamComposer = require('../../data/composers/TeamComposer');
const voiceCommander = require('../../VoiceCommander');

class MenuBar extends BaseView {
  constructor({
    title,
    viewSwitcher,
    image,
    currencySign,
    elements,
    corners = [],
    setMenuImage = true,
    appendTop = false,
    showControls = {},
    showClock = true,
    menuItems = [],
    classes = [],
    elementId = `menuBar-${Date.now()}`,
  }) {
    super({
      elementId,
      corners,
      classes: classes.concat(['menuBar']),
    });

    const permissions = storageManager.getPermissions();

    const controls = showControls;
    controls.user = controls.user || true;
    controls.alias = controls.alias || true;

    const items = [];
    const lastItems = [];

    this.viewSwitcher = viewSwitcher;
    this.showClock = showClock;
    this.lists = [];
    this.appendTop = appendTop;
    this.image = image;

    viewSwitcher.parentElement.addEventListener('click', () => {
      this.menuList.classList.add('hide');

      if (this.viewList) {
        this.viewList.classList.add('hide');
      }

      this.currentUserList.hideView();
    });

    this.element.addEventListener('click', () => {
      if (!socketManager.isOnline) {
        socketManager.reconnect();
      }
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.OFFLINE,
      func: () => {
        this.element.classList.add('offline');
      },
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.ONLINE,
      func: () => {
        this.element.classList.remove('offline');
      },
    });

    if (controls.user) {
      const logoutButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'logout' }),
        clickFuncs: {
          leftFunc: () => {
            socketManager.logout({
              callback: ({ error }) => {
                if (error) {
                  console.log('Failed to logout');

                  return;
                }

                console.log('Logged out');
              },
            });
          },
        },
      });
      const loginButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'login' }),
        clickFuncs: {
          leftFunc: () => {
            const login = new LoginDialog({});

            login.addToView({
              element: this.getParentElement(),
            });
          },
        },
      });
      const registerButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'register' }),
        clickFuncs: {
          leftFunc: () => {
            const register = new RegisterDialog({});

            register.addToView({
              element: this.getParentElement(),
            });
          },
        },
      });
      const profileButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'myProfile' }),
        clickFuncs: {
          leftFunc: () => {
            const profileDialog = new UserSelfDialog({});

            profileDialog.addToView({
              element: this.getParentElement(),
            });
          },
        },
      });
      const rebootButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'reboot' }),
        clickFuncs: {
          leftFunc: () => {
            window.location.reload(true);
          },
        },
      });

      accessCentral.addAccessElement({
        maxAccessLevel: accessCentral.AccessLevels.ANONYMOUS,
        element: loginButton,
      });
      accessCentral.addAccessElement({
        minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
        element: logoutButton,
      });
      accessCentral.addAccessElement({
        maxAccessLevel: permissions.CreateUser
          ? permissions.CreateUser.accessLevel
          : accessCentral.AccessLevels.ANONYMOUS,
        element: registerButton,
      });
      accessCentral.addAccessElement({
        minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
        element: profileButton,
      });

      items.push({
        elements: [loginButton],
      }, {
        elements: [registerButton],
      });
      lastItems.push({
        elements: [
          profileButton,
          logoutButton,
          rebootButton,
        ],
      });

      voiceCommander.addCommands({
        activationString: 'menu',
        commands: [
          {
            strings: ['logout'],
            func: () => {
              socketManager.logout({
                callback: ({ error }) => {
                  if (error) {
                    console.log('Failed to logout');

                    return;
                  }

                  console.log('Logged out');
                },
              });
            },
          }, {
            strings: ['login'],
            func: () => {
              const login = new LoginDialog({});

              login.addToView({
                element: this.getParentElement(),
              });
            },
          }, {
            strings: ['register'],
            func: () => {
              const register = new RegisterDialog({});

              register.addToView({
                element: this.getParentElement(),
              });
            },
          },
        ],
      });
    }

    if (showControls.docFile) {
      const openDocButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'openDocument' }),
        clickFuncs: {
          leftFunc: () => {
            const dialog = new OpenDocFileDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        },
      });

      const createDocFileButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'createDocument' }),
        clickFuncs: {
          leftFunc: () => {
            const dialog = new DocFileDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        },
      });

      items.push({ elements: [openDocButton, createDocFileButton] });

      accessCentral.addAccessElement({
        element: createDocFileButton,
        minimumAccessLevel: permissions.CreateDocFile
          ? permissions.CreateDocFile.accessLevel
          : accessCentral.AccessLevels.STANDARD,
      });

      voiceCommander.addCommands({
        activationString: 'create',
        commands: [{
          strings: [
            'file',
            'document',
          ],
          func: () => {
            const dialog = new DocFileDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        }],
      });
    }

    if (showControls.room) {
      const createRoomButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'createRoom' }),
        clickFuncs: {
          leftFunc: () => {
            const dialog = new RoomDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        },
      });

      items.push({ elements: [createRoomButton] });

      accessCentral.addAccessElement({
        element: createRoomButton,
        minimumAccessLevel: permissions.CreateRoom
          ? permissions.CreateRoom.accessLevel
          : accessCentral.AccessLevels.STANDARD,
      });

      voiceCommander.addCommands({
        activationString: 'create',
        commands: [{
          strings: [
            'room',
            'chat room',
          ],
          func: () => {
            const dialog = new RoomDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        }],
      });
    }

    if (showControls.alias) {
      const createAliasButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'createAlias' }),
        clickFuncs: {
          leftFunc: () => {
            const dialog = new AliasDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        },
      });

      items.push({ elements: [createAliasButton] });

      accessCentral.addAccessElement({
        element: createAliasButton,
        minimumAccessLevel: permissions.CreateAlias
          ? permissions.CreateAlias.accessLevel
          : accessCentral.AccessLevels.STANDARD,
      });

      voiceCommander.addCommands({
        activationString: 'create',
        commands: [{
          strings: [
            'alias',
            'alter ego',
          ],
          func: () => {
            const dialog = new AliasDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        }],
      });
    }

    if (showControls.team) {
      const createTeamButton = elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'Button', label: 'createTeam' }),
        clickFuncs: {
          leftFunc: () => {
            const dialog = new TeamCreateDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        },
      });

      items.push({
        elements: [
          createTeamButton,
        ],
      });

      accessCentral.addAccessElement({
        element: createTeamButton,
        minimumAccessLevel: permissions.CreateTeam
          ? permissions.CreateTeam.accessLevel
          : accessCentral.AccessLevels.STANDARD,
      });

      voiceCommander.addCommands({
        activationString: 'create',
        commands: [{
          strings: [
            'team',
            'group',
          ],
          func: () => {
            const dialog = new TeamCreateDialog({});

            dialog.addToView({
              element: this.viewSwitcher.getParentElement(),
            });
          },
        }],
      });

      eventCentral.addWatcher({
        event: eventCentral.Events.COMPLETE_USER,
        func: () => {
          const identity = userComposer.getCurrentIdentity();

          if (identity.partOfTeams && identity.partOfTeams.length > 0) {
            createTeamButton.classList.add('hide');
          }
        },
      });

      eventCentral.addWatcher({
        event: eventCentral.Events.CHANGED_ALIAS,
        func: ({ userId }) => {
          const identity = userComposer.getIdentity({ objectId: userId });

          if (identity.partOfTeams && identity.partOfTeams.length > 0) {
            createTeamButton.classList.add('hide');
          } else {
            createTeamButton.classList.remove('hide');
          }
        },
      });
    }

    if (items.concat(menuItems, lastItems).length > 0) {
      this.menuList = elementCreator.createList({
        classes: ['hide', 'topMenu'],
        items: items.concat(menuItems, lastItems),
        clickFuncs: {
          leftFunc: () => {
            this.menuList.classList.add('hide');
          },
        },
      });

      const menuButtonParams = {
        classes: ['menuButton'],
        list: this.menuList,
        leftFunc: (event) => {
          this.menuList.classList.toggle('hide');

          event.stopPropagation();
        },
      };

      if (setMenuImage) {
        menuButtonParams.image = {
          fileName: 'menuicon.png',
          height: 20,
          width: 20,
        };
      } else {
        menuButtonParams.text = labelHandler.getLabel({ baseObject: 'MenuBar', label: 'menu' });
      }

      const menuButton = this.createMenuButton(menuButtonParams);

      this.lists.push(this.menuList);
      this.element.appendChild(elementCreator.createContainer({
        elements: [menuButton, this.menuList],
      }));
    }

    if (showControls.currentUser) {
      this.currentUserList = new CurrentUserList({
        classes: ['hide', 'topMenu'],
      });
      const menuButton = this.createMenuButton({
        list: this.currentUserList,
        leftFunc: (event) => {
          this.currentUserList.toggleView();

          event.stopPropagation();
        },
      });
      const container = elementCreator.createContainer({
        elements: [menuButton],
      });
      const watcherFunc = () => {
        MenuBar.setUsername({ button: menuButton });
      };

      this.lists.push(this.currentUserList);
      this.currentUserList.addToView({ element: container });
      this.element.appendChild(container);

      eventCentral.addWatcher({
        event: eventCentral.Events.COMPLETE_USER,
        func: watcherFunc,
      });

      eventCentral.addWatcher({
        event: eventCentral.Events.USER_CHANGE,
        func: watcherFunc,
      });

      eventCentral.addWatcher({
        event: eventCentral.Events.CHANGED_ALIAS,
        func: watcherFunc,
      });
    }

    if (showControls.wallet) {
      const walletInfo = new WalletInfo({
        sign: currencySign,
        appendSign: true,
      });

      walletInfo.addToView({ element: this.element });
    }

    if (elements) {
      elements.forEach((element) => {
        this.element.appendChild(elementCreator.createContainer({ elements: [element] }));
      });
    }

    if (image) {
      this.element.appendChild(elementCreator.createPicture({
        picture: image,
        isUploaded: false,
      }));
    }

    if (this.showClock) {
      this.timeSpan = elementCreator.createSpan({
        text: labelHandler.getLabel({ baseObject: 'MenuBar', label: 'emptyTime' }),
      });

      this.element.appendChild(this.timeSpan);

      this.updateClock();
    }

    if (title) {
      this.element.appendChild(elementCreator.createSpan({ text: title }));
    }
  }

  hideLists({ currentList }) {
    if (this.menuList && this.menuList !== currentList) { this.menuList.classList.add('hide'); }
    if (this.viewList && this.viewList !== currentList) { this.viewList.classList.add('hide'); }
    if (this.currentUserList && this.currentUserList !== currentList) { this.currentUserList.hideView(); }
  }

  createMenuButton({
    list,
    image,
    leftFunc = () => {},
    text = '-----',
    classes = [],
  }) {
    return elementCreator.createSpan({
      text,
      image,
      classes: ['topMenuButton'].concat(classes),
      clickFuncs: {
        leftFunc: (event) => {
          leftFunc(event);

          this.hideLists({ currentList: list });
        },
      },
    });
  }

  static setUsername({ button }) {
    const buttonToChange = button;
    const userId = storageManager.getUserId();
    const aliasId = storageManager.getAliasId();

    if (aliasId) {
      buttonToChange.textContent = aliasComposer.getAliasName({ aliasId });
    } else if (userId) {
      buttonToChange.textContent = userComposer.getUsername({ userId });
    } else {
      buttonToChange.textContent = '-----';
    }
  }

  updateClock() {
    if (!this.showClock) {
      return;
    }

    setTimeout(() => {
      const time = textTools.generateTimestamp({ date: Date.now() });

      if (!this.currentTime || time.mins !== this.currentTime.mins) {
        this.currentTime = textTools.generateTimestamp({ date: Date.now() });
        this.timeSpan.textContent = this.currentTime.halfTime;
      }

      this.updateClock();
    }, 100);
  }

  setViews({ views }) {
    views.forEach((viewObject) => {
      const viewObjectToAdd = viewObject;

      viewObjectToAdd.clickFuncs = {
        leftFunc: () => {
          this.viewSwitcher.switchView({ view: viewObjectToAdd.view });
        },
      };
    });

    this.viewList = elementCreator.createList({
      items: views.map((viewObject) => {
        const { clickFuncs, view } = viewObject;

        return {
          elements: [elementCreator.createButton({
            clickFuncs,
            text: view.getTitle(),
          })],
        };
      }),
      classes: ['hide', 'topMenu'],
      clickFuncs: {
        leftFunc: () => {
          this.viewList.classList.add('hide');
        },
      },
    });

    const menuButton = this.createMenuButton({
      list: this.viewList,
      leftFunc: (event) => {
        this.viewList.classList.toggle('hide');

        event.stopPropagation();
      },
      text: labelHandler.getLabel({ baseObject: 'MenuBar', label: '-----' }),
    });
    const container = elementCreator.createContainer({ elements: [menuButton, this.viewList] });

    if (this.lists.length === 0) {
      this.element.insertBefore(container, this.element.firstElementChild);
    } else {
      this.element.insertBefore(container, this.element.childNodes[this.lists.length - 1].nextSibling);
    }

    this.lists.push(this.viewList);

    eventCentral.addWatcher({
      event: eventCentral.Events.VIEW_SWITCHED,
      func: ({ view }) => {
        menuButton.textContent = view.getTitle();
      },
    });
  }
}

module.exports = MenuBar;
