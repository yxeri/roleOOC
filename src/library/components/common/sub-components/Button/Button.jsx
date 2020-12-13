import React from 'react';
import {
  arrayOf,
  bool,
  func,
  node,
  oneOf, string,
} from 'prop-types';

import './Button.scss';

const Button = ({
  onClick,
  children,
  disabled,
  classNames = [''],
  type = 'button',
}) => (
  <button
    className={`${['Button'].concat(classNames).join(' ')}`}
    disabled={disabled}
    type={type} /* eslint-disable-line react/button-has-type */
    onClick={(event) => { onClick(event); }}
  >
    {children}
  </button>
);

export default Button;

Button.propTypes = {
  onClick: func.isRequired,
  children: node.isRequired,
  type: oneOf(['button', 'submit']),
  disabled: bool,
  classNames: arrayOf(string),
};

Button.defaultProps = {
  type: 'button',
  disabled: undefined,
  classNames: [],
};
