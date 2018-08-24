import { generateUUID, getEmailFromUrlParam } from "./utils.js";

const API_URL = ""; // TODO

// Hack to store own contact
export var MY_CONTACT = null;

// Changed with login apicall, or taken from localStorage
export var TOKEN = null;

// Prefill token from localStorage
const slim_user = sessionStorage.getItem("slim_user");
if (slim_user) {
  TOKEN = JSON.parse(slim_user)[getEmailFromUrlParam()];
}

// Helper for making POST apicalls
const apiPost = (url, params) => {
  const headers = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // To also pass cookies with every apicall
    body: JSON.stringify({
      ticket: TOKEN,
      ...params
    })
  };

  return window.fetch(API_URL + url, headers).then(response => {
    if (response.ok) {
      return response.json().then(res => Promise.resolve(res));
    }
    return response.json().then(res => Promise.reject(res));
  });
};

// Log in and store token
export const login = (email, password) => {
  return apiPost("/api/account/login", { email, password }).then(response => {
    TOKEN = response.ticket;

    const slim_user = { [email]: TOKEN };
    sessionStorage.setItem("slim_user", JSON.stringify(slim_user));
  });
};

// Sync conversation messages and contacts ..
// .. every time a conversation is opened
export const syncConversationMessages = conversationId => {
  const event = {
    client_req_id: generateUUID(),
    mk_event_type: "urn:fleep:client:conv:sync_initial",
    params: {
      conversation_id: conversationId
    }
  };

  return apiPost("/api/event/store/", {
    stream: [event]
  });
};

// Send message
export const sendMessage = (conversation_id, message) => {
  const event = {
    client_req_id: generateUUID(),
    mk_event_type: "urn:fleep:client:message:add_plain",
    params: {
      conversation_id,
      message
    }
  };

  return apiPost("/api/event/store/", {
    stream: [event]
  });
};

let LAST_EVENT_HORIZON = 0;
export const longPoll = event_horizon => {
  if (!event_horizon) {
    event_horizon = LAST_EVENT_HORIZON;
  }

  return apiPost("/api/account/poll", { wait: true, event_horizon }).then(
    response => {
      // Middleware to store event_horizon
      LAST_EVENT_HORIZON = response.event_horizon;

      return Promise.resolve(response);
    }
  );
};
