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

const List = require('./List');

const dataHandler = require('../../data/DataHandler');
const walletComposer = require('../../data/composers/WalletComposer');
const labelHandler = require('../../labels/LabelHandler');

class TransactionList extends List {
  constructor({
    reverseSorting = true,
    toText = '->',
    classes = [],
    elementId = `tList-${Date.now()}`,
  }) {
    const headerFields = [
      {
        paramName: 'customTimeCreated',
        fallbackTo: 'timeCreated',
        convertFunc: (time) => {
          return time;
        },
      }, {
        paramName: 'fromWalletId',
        convertFunc: (fromWalletId) => {
          return `${walletComposer.getWalletOwnerName({ walletId: fromWalletId }) || fromWalletId} ${toText}`;
        },
      }, {
        paramName: 'toWalletId',
        convertFunc: (toWalletId) => {
          return `${walletComposer.getWalletOwnerName({ walletId: toWalletId }) || toWalletId}.`;
        },
      }, {
        paramName: 'amount',
        convertFunc: (amount) => {
          return `${labelHandler.getLabel({ baseObject: 'TransactionList', label: 'amount' })}: ${amount}.`;
        },
      }, {
        paramName: 'coordinates',
        convertFunc: (coordinates) => {
          if (coordinates) {
            const { longitude, latitude } = coordinates;

            return `${labelHandler.getLabel({ baseObject: 'TransactionList', label: 'sentFrom' })}: Latitude ${latitude} Longitude ${longitude}`;
          }

          return '';
        },
      },
    ];

    super({
      elementId,
      sorting: {
        paramName: 'cutomTimeCreated',
        fallbackParamName: 'timeCreated',
        reverse: reverseSorting,
      },
      classes: classes.concat(['transactionList']),
      dependencies: [
        dataHandler.transactions,
        dataHandler.aliases,
        dataHandler.users,
        dataHandler.teams,
        dataHandler.wallets,
      ],
      listItemClickFuncs: {
        // leftFunc: (objectId) => {
        //
        // },
      },
      collector: dataHandler.transactions,
      listItemFields: headerFields,
    });
  }
}

module.exports = TransactionList;
