import React from 'react';
import { useSelector } from 'react-redux';
import { arrayOf, func, string } from 'prop-types';

import ListItem from '../../../../common/lists/List/Item/ListItem';
import { getWalletById } from '../../../../../redux/selectors/wallets';
import { getIdentityOrTeamById } from '../../../../../redux/selectors/users';

const WalletItem = ({ walletId, onChange, classNames = [] }) => {
  const wallet = useSelector((state) => getWalletById(state, { id: walletId }));
  const identity = useSelector((state) => getIdentityOrTeamById(state, { id: walletId }));

  return (
    <ListItem
      classNames={['WalletItem'].concat(classNames)}
      onClick={() => onChange(walletId)}
    >
      {identity ? `${identity.teamName || identity.aliasName || identity.username}: ${wallet.amount}` : 'Show all'}
    </ListItem>
  );
};

export default React.memo(WalletItem);

WalletItem.propTypes = {
  walletId: string.isRequired,
  onChange: func.isRequired,
  classNames: arrayOf(string),
};

WalletItem.defaultProps = {
  classNames: [],
};
