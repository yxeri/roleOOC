import React from 'react';
import { arrayOf, string } from 'prop-types';
import { useSelector } from 'react-redux';
import List from '../../common/sub-components/List/List';
import { getTransactionsByWallets } from '../../../redux/selectors/transactions';
import { getIdentitiesByIds } from '../../../redux/selectors/users';
import { getWalletByIds } from '../../../redux/selectors/wallets';

export default function TransactionList({ walletIds }) {
  const transactions = useSelector((state) => getTransactionsByWallets(state, { walletIds }));
  const wallets = useSelector((state) => getWalletByIds(state, { walletIds: transactions.map((trans) => trans.fromWalletId).concat(transactions.map((trans) => trans.toWalletId)) }));
  const identities = useSelector((state) => getIdentitiesByIds(state, { identityIds: wallets.map((wallet) => wallet.ownerAliasId || wallet.ownerId) }));
  const createTransactions = () => transactions.map((transaction) => {
    const toWallet = wallets.find((wallet) => wallet.objectId === transactions.toWalletId);
    const fromWallet = wallets.find((wallet) => wallet.objectId === transactions.fromWalletId);
    const to = identities.find((identity) => identity.objectId === (toWallet.ownerAliasId || toWallet.ownerId));
    const from = identities.find((identity) => identity.objectId === (toWallet.ownerAliasId || fromWallet.ownerId));

    return (
      <li key={transaction.objectId}>
        <span>{transaction.amount}</span>
        <span>{from.aliasName || from.username}</span>
        <span>{to.aliasName || to.username}</span>
      </li>
    );
  });

  return (
    <List
      large
      classNames={['transactionList']}
    >
      {createTransactions()}
    </List>
  );
}

TransactionList.propTypes = {
  walletIds: arrayOf(string).isRequired,
};
