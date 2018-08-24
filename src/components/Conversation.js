import React from "react";
import { syncConversationMessages, sendMessage } from "../api";

const styleConvView = {
  overflow: "auto",
  display: "flex",
  flexDirection: "column-reverse",
  flex: 3
};
const styleMessage = { borderBottom: "1px solid #ccc", padding: "0 12px" };
const styleAuthor = {
  fontWeight: "600",
  marginTop: "12px",
  marginBottom: "-12px"
};
const styleMessageList = {
  maxHeight: "calc(100% - 77px)",
  overflow: "auto",
  display: "flex",
  flexDirection: "column-reverse"
};
const styleTextarea = {
  maxHeight: "77px",
  resize: "none",
  fontSize: "1em",
  lineHeight: "1em",
  padding: ".5em",
  height: "77px"
};
const styleTimestamp = { color: "#777", paddingLeft: "8px", fontSize: "14px" };

class MessageListItem extends React.PureComponent {
  render() {
    return (
      <div className="message" style={styleMessage}>
        <div className="author" style={styleAuthor}>
          <span>{this.props.authorName}</span>
          <span style={styleTimestamp}>{this.props.timestamp}</span>
        </div>
        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: this.props.content }}
        />
      </div>
    );
  }
}

export default class Conversation extends React.Component {
  state = {
    textareaContent: "",
    isSyncing: false,
    messages: [],
    contacts: []
  };

  componentDidMount() {
    // Sync messages when conversation is opened
    if (this.props.activeConversationId) {
      this.doSync();
    }
  }

  componentDidUpdate(prevProps) {
    // Sync messages when conversation changes
    // (the component does not mount again if it's already rendered when the conversationId changes)
    if (prevProps.activeConversationId !== this.props.activeConversationId) {
      this.doSync();
    }
  }

  doSync = () => {
    this.setState({ isSyncing: true });

    return syncConversationMessages(this.props.activeConversationId)
      .then(({ messages, contacts }) => {
        this.setState({ messages, contacts });
      })
      .finally(() => {
        this.setState({ isSyncing: false });
      });
  };

  doSend = message => {
    return sendMessage(this.props.activeConversationId, message).then(
      newMessageRecord => {
        // Add the new message to top
        this.setState({
          messages: [newMessageRecord, ...this.state.messages],
          textareaContent: ""
        });
      }
    );
  };

  onTextareaChange = event => {
    this.setState({ textareaContent: event.target.value });
  };

  onTextareaKey = event => {
    const message = this.state.textareaContent;

    const hasMessage = !!message.trim();
    const pressedEnter = event.keyCode === 13;
    const pressedShift = event.shiftKey;

    // Send message if Enter key is pressed
    if (pressedEnter && !pressedShift && hasMessage) {
      event.preventDefault(); // Prevent newline from being entered
      this.doSend(message);
    }
  };

  getAuthorName(authorId) {
    const contact = this.state.contacts.find(
      contact => contact.account_id === authorId
    );
    return contact ? contact.display_name || contact.email : authorId;
  }

  getMessageTime(posted_time) {
    const posted = new Date(posted_time * 1000);
    const today = new Date();

    const todayDate = today.toLocaleDateString();
    const postedTime = posted.toLocaleTimeString();
    const postedDate = posted.toLocaleDateString();

    if (postedDate === todayDate) {
      return `${postedTime}`;
    }
    return `${postedTime}, ${postedDate}`;
  }

  renderMessages = () => {
    if (this.state.isSyncing) {
      return "Syncing...";
    }

    if (!this.state.messages.length) {
      return "No messages";
    }

    return this.state.messages.map(message => {
      return (
        <MessageListItem
          key={"message-" + message.message_nr}
          messageNr={message.message_nr}
          authorName={this.getAuthorName(message.account_id)}
          timestamp={this.getMessageTime(message.posted_time)}
          content={message.message}
        />
      );
    });
  };

  render() {
    if (!this.props.activeConversationId) {
      return <div className="conv-view" style={styleConvView}></div>;
    }

    return (
      <div className="conv-view" style={styleConvView}>
        <textarea
          rows="2"
          maxLength="307200"
          value={this.state.textareaContent}
          onChange={this.onTextareaChange}
          onKeyDown={this.onTextareaKey}
          placeholder="Type your message"
          style={styleTextarea}
        />
        <div className="message-list" style={styleMessageList}>
          {this.renderMessages()}
        </div>
      </div>
    );
  }
}
