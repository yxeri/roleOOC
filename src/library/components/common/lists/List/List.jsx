import React, { useEffect, useRef, useState } from 'react';
import {
  string,
  arrayOf,
  bool,
  node,
  shape,
} from 'prop-types';

import './List.scss';

// eslint-disable-next-line react/prop-types
const ListItems = React.memo(({ items }) => (<>{items}</>));

const List = ({
  children,
  title,
  scrollTo,
  dropdown = false,
  classNames = [],
}) => {
  const listRef = useRef(null);
  const windowRef = useRef(null);
  const [hidden, setHidden] = useState(typeof title !== 'undefined');
  const listClasses = [];
  const classes = ['List'].concat(classNames);

  useEffect(() => {
    if (scrollTo && listRef.current) {
      if (scrollTo.direction === 'bottom' && listRef.current.lastElementChild) {
        listRef.current.lastElementChild.scrollIntoView();
      }
    }
  });

  if (!hidden) {
    classes.push('expanded');
  } else {
    listClasses.push('hide');
  }

  if (dropdown) {
    listClasses.push('dropdown');
  }

  return (
    <div
      key="List"
      className={classes.join(' ')}
    >
      { title && (
        <header
          role="button"
          tabIndex={0}
          key="listHeader"
          className="toggle clickable"
          onClick={() => {
            setHidden(!hidden);
          }}
        >
          {title}
        </header>
      )}
      <ul
        ref={(element) => {
          listRef.current = element;

          if (element) {
            windowRef.current = element.closest('.Window');
          }
        }}
        key="listElem"
        className={`${listClasses.join(' ')}`}
        onClick={() => {
          if (dropdown && (!windowRef.current || windowRef.current.offsetWidth < 600)) {
            setHidden(true);
          }
        }}
      >
        <ListItems items={children} />
      </ul>
    </div>
  );
};

export default React.memo(List);

List.propTypes = {
  children: node,
  title: node,
  classNames: arrayOf(string),
  dropdown: bool,
  scrollTo: shape({
    direction: string,
    buffer: bool,
  }),
};

List.defaultProps = {
  classNames: [],
  children: undefined,
  title: undefined,
  dropdown: false,
  scrollTo: undefined,
};
