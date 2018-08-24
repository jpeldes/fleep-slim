import { generateUUID, getEmailFromUrlParam } from "./utils.js";
import { renderLogin } from "./index.js";

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

// Sync conversations.
// Initial poll, with event_horizon: 0 ..
// .. gives all basic records - teams, contacts, conversations
export const syncConversations = () => {
  return apiPost("/api/account/poll", { wait: false, event_horizon: 0 })
    .then(response => {
      MY_CONTACT = response.stream.find(
        item =>
          item.mk_rec_type === "contact" &&
          item.hasOwnProperty("activated_time")
      );

      return response.stream.filter(item => item.mk_rec_type === "conv");
    })
    .catch(error => {
      if (error.error_id.toLowerCase() === "unauthorized") {
        renderLogin();
      }
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
  }).then(response => {
    // Filter contact records from stream
    let contacts = response.stream.filter(
      item => item.mk_rec_type === "contact"
    );
    if (MY_CONTACT) {
      // Hack to get my own contact in here, as its not within the sync apicall
      contacts = [MY_CONTACT, ...contacts];
    }

    // Filter message records from stream
    let messages = response.stream.filter(
      item =>
        item.mk_rec_type === "message" && // Find only message records
        item.mk_message_state !== "urn:fleep:message:mk_message_state:system" // Ignore system messages
    );
    // Sort messages by inbox_nr
    messages = messages.sort((a, b) => (a.inbox_nr < b.inbox_nr ? 1 : -1));

    return Promise.resolve({ messages, contacts });
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
  }).then(response => {
    const request = response.requests[0];
    if (request && request.status_code === 200) {
      const newMessageNr = request.identifier.message_nr;
      const newMessage = response.stream.find(
        record =>
          record.mk_rec_type === "message" && record.message_nr === newMessageNr
      );
      return Promise.resolve(newMessage);
    }
    return Promise.reject(response);
  });
};
