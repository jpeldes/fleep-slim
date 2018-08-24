import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

import { TOKEN } from "./api";
import App from "./components/App";
import Login from "./components/Login";

export function renderLogin() {
  ReactDOM.render(<Login />, document.getElementById("root"));
}

export function renderApp() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

if (!TOKEN) {
  renderLogin();
} else {
  renderApp();
}
