import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { polyfill } from 'seamless-scroll-polyfill';

import App from './App';
import store from './library/redux/store';

import './index.scss';

const ElementQueries = require('css-element-queries');

polyfill();
ElementQueries.ElementQueries.listen();

document.body.addEventListener('click', () => {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
});

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
