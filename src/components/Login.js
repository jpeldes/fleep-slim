import React from "react";
import { login } from "../api";
import { renderApp } from "..";
import { getEmailFromUrlParam } from "../utils";

export default class Login extends React.Component {
  state = {
    disabled: false,
    error: ""
  };
  submit = e => {
    e.preventDefault();

    this.setState({ error: "", disabled: true });

    const email = e.target.email.value;
    const password = e.target.pw.value;

    login(email, password)
      .then(() => {
        renderApp();
      })
      .catch(error => {
        this.setState({ error: error.error_message, disabled: false });
      });
  };
  render() {
    return (
      <div>
        <form
          onSubmit={this.submit}
          style={{ width: "50%", margin: "10% auto" }}
        >
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              defaultValue={getEmailFromUrlParam()}
            />
          </div>
          <div>
            <label htmlFor="pw">Password</label>
            <input id="pw" name="pw" type="password" placeholder="Password" />
          </div>

          <button
            type="submit"
            disabled={this.state.disabled}
            style={{
              marginTop: "1em",
              lineHeight: "2em",
              width: "100%",
              background: "initial"
            }}
          >
            SIGN IN
          </button>
          {this.state.error && (
            <p style={{ color: "red", textAlign: "center" }}>
              {this.state.error}
            </p>
          )}
        </form>
      </div>
    );
  }
}
