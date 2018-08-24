import React from "react";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import { longPoll, syncConversationMessages, sendMessage } from "../api";

// Styles

const styleApp = { display: "flex", maxHeight: "100%", height: "100%" };

// Helpers

// to Update or Create new records
export const updateItem = (id, item, list) => {
  if (list[id]) {
    return Object.assign(list[id], item); // Overwrites old properties, creates new properties
  } else {
    return (list[id] = item); // Create
  }
};

// process some selected records from stream
export const processStream = (response, state) => {
  let { conversations, contacts, messages } = state;

  response.stream.forEach(item => {
    if (item.mk_rec_type === "conv") {
      updateItem(item.conversation_id, item, conversations);
    }

    if (item.mk_rec_type === "contact") {
      updateItem(item.account_id, item, contacts);
    }

    if (item.mk_rec_type === "message") {
      updateItem(item.message_id, item, messages);
    }
  });

  return { conversations, contacts, messages };
};

// Component

export default class App extends React.Component {
  state = {
    activeConversationId: null,

    contacts: {},
    conversations: {},
    messages: {}
  };

  componentDidMount() {
    this.startPoll();
  }

  // Polling & processing the response

  startPoll = () => {
    console.log("Starting poll");

    return longPoll()
      .then(this.processPoll)
      .then(this.startPoll)
      .catch(this.catchPoll);
  };

  processPoll = response => {
    let newState = processStream(response, this.state);

    this.setState(newState);
  };

  catchPoll = error => {
    console.log(error);
    console.log("Something went wrong. Restarting poll in 5 seconds.");

    const SECONDS = 1000;
    setTimeout(() => {
      this.startPoll();
    }, 5 * SECONDS);
  };

  // API calls && event handlers passed down to child components

  onChangeConversation = selectedConversationId => {
    this.setState({ activeConversationId: selectedConversationId });
  };

  onSyncConversationMessages = conversationId => {
    return syncConversationMessages(conversationId).then(this.processPoll);
  };

  onSendMessage = (conversationId, message) => {
    return sendMessage(conversationId, message).then(this.processPoll);
  };

  // Selectors, for filtering renderable data

  getMessageOrder() {
    let messageOrder = [];
    if (this.state.activeConversationId) {
      messageOrder = Object.values(this.state.messages)
        .filter(
          item =>
            item.conversation_id === this.state.activeConversationId &&
            item.mk_message_state !==
              "urn:fleep:message:mk_message_state:system"
        )
        .sort((a, b) => (a.inbox_nr < b.inbox_nr ? 1 : -1));
    }
    return messageOrder;
  }

  getConversationOrder() {
    return Object.values(this.state.conversations).sort(
      (a, b) => (a.inbox_time < b.inbox_time ? 1 : -1)
    );
  }

  getTextareaDisabled() {
    if (this.state.activeConversationId) {
      const conversation = this.state.conversations[this.state.activeConversationId];
      return conversation && !conversation.can_post;
    }
    return true;
  }

  // Rendering

  render() {
    let conversationOrder = this.getConversationOrder();
    let messageOrder = this.getMessageOrder();
    let isTextareaDisabled = this.getTextareaDisabled();

    return (
      <div className="app" style={styleApp}>
        <ConversationList
          conversations={conversationOrder}
          activeConversationId={this.state.activeConversationId}
          onChangeConversation={this.onChangeConversation}
        />
        <Conversation
          messages={messageOrder}
          contacts={this.state.contacts}
          activeConversationId={this.state.activeConversationId}
          syncConversationMessages={this.onSyncConversationMessages}
          sendMessage={this.onSendMessage}
          isTextareaDisabled={isTextareaDisabled}
        />
      </div>
    );
  }
}
