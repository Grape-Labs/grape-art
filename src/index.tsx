import ReactXnft, { AnchorDom } from "react-xnft";
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { hydrate, render } from "react-dom";
import App from './App';

/*
const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
  hydrate(<App />, rootElement);
} else {
  render(<App />, rootElement);
}*/

ReactDOM.render(
    <StrictMode>
        <App />
    </StrictMode>,
    document.getElementById('app')
);

ReactXnft.render(
  <AnchorDom>
    <App />
  </AnchorDom>
);
