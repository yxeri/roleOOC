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

import BaseDialog from './BaseDialog';
import TemporaryDialog from './TemporaryDialog';

import elementCreator from '../../../ElementCreator';
import labelHandler from '../../../labels/LabelHandler';
import walletComposer from '../../../data/composers/WalletComposer';
import transactionComposer from '../../../data/composers/TransactionComposer';
import userComposer from '../../../data/composers/UserComposer';
import teamComposer from '../../../data/composers/TeamComposer';
import tracker from '../../../PositionTracker';
import viewSwitcher from '../../../ViewSwitcher';

const ids = {
  FROMTEAM: 'fromTeam',
};

class WalletDialog extends BaseDialog {
  constructor({
    sendFromId,
    sendToId,
    isTeam,
    classes = [],
    elementId = `wDialog-${Date.now()}`,
  }) {
    const identityName = isTeam
      ? teamComposer.getTeamName({ teamId: sendToId })
      : userComposer.getIdentityName({ objectId: sendToId });
    const walletAmount = walletComposer.getWalletAmount({ walletId: sendFromId });
    const thisIdentityName = userComposer.getIdentityName({ objectId: sendFromId }) || teamComposer.getTeamName({ teamId: sendFromId });
    const {
      objectId: identityId,
      partOfTeams = [],
    } = userComposer.getIdentity({ objectId: sendFromId });
    const team = partOfTeams.length > 0
      ? teamComposer.getTeam({ teamId: partOfTeams[0] })
      : undefined;

    const lowerButtons = [
      elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'cancel' }),
        clickFuncs: {
          leftFunc: () => {
            this.removeFromView();
          },
        },
      }),
      elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'sendAmount' }),
        clickFuncs: {
          leftFunc: () => {
            if (this.hasEmptyRequiredInputs()) {
              return;
            }

            const fromWalletId = this.getInputValue(ids.FROMTEAM, 'checkBox')
              ? team.objectId
              : identityId;
            const amount = this.getInputValue('walletAmount');

            transactionComposer.createTransaction({
              transaction: {
                fromWalletId,
                amount,
                coordinates: tracker.getBestPosition(),
                toWalletId: sendToId,
                note: this.getInputValue('walletNote'),
              },
              callback: ({ error }) => {
                if (error) {
                  this.updateLowerText({ text: [labelHandler.getLabel({ baseObject: 'Transaction', label: 'failed' })] });

                  return;
                }

                const tempDialog = new TemporaryDialog({
                  timeout: 30000,
                  text: [
                    labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'transferComplete' }),
                    `From: ${thisIdentityName}`,
                    `To: ${identityName}.`,
                    `Amount: ${amount}`,
                  ],
                });

                tempDialog.addToView({ element: viewSwitcher.getParentElement() });
                this.removeFromView();
              },
            });
          },
        },
      }),
    ];
    const inputs = [
      elementCreator.createInput({
        elementId: 'walletAmount',
        inputName: 'walletAmount',
        isRequired: true,
        maxLength: 10,
        type: 'number',
        placeholder: labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'amountPlaceholder' }),
      }),
      elementCreator.createInput({
        elementId: 'walletNote',
        inputName: 'walletNote',
        maxLength: 50,
        placeholder: labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'note' }),
      }),
    ];

    if (team) {
      inputs.push(elementCreator.createCheckBox({
        text: labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'transferFromTeam' }),
        elementId: ids.FROMTEAM,
      }));
    }

    const upperText = [labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'transfer' })];
    const lowerText = [
      `${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'sendingFrom' })}: ${thisIdentityName}.`,
      isTeam
        ? `${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'sendingToTeam' })}: ${identityName}.`
        : `${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'sendingTo' })}: ${identityName}.`,
      `${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'youHave' })} ${walletAmount} ${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'currency' })}.`,
    ];

    if (team) {
      lowerText.push(`${team.teamName} 
        ${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'teamHas' })} 
        ${walletComposer.getWalletAmount({ walletId: team.objectId })} 
        ${labelHandler.getLabel({ baseObject: 'WalletDialog', label: 'currency' })}.`);
    }

    super({
      elementId,
      lowerButtons,
      inputs,
      lowerText,
      upperText,
      classes: classes.concat(['walletDialog']),
    });
  }
}

export default WalletDialog;
