import React from "react";

const styleConvView = {
  overflow: "auto",
  display: "flex",
  flexDirection: "column-reverse",
  flex: 3
};
const styleMessage = {
  borderBottom: "1px solid #ccc",
  padding: "0 12px",
  margin: "8px 12px",
  border: "2px solid #eee",
  borderRadius: "8px"
};
const styleAuthor = {
  fontWeight: "600",
  marginTop: "12px",
  marginBottom: "-12px"
};
const styleMessageList = {
  maxHeight: "calc(100% - 77px)",
  overflow: "auto",
  display: "flex",
  flexDirection: "column-reverse",
  flex: "1"
};
const styleTextarea = {
  maxHeight: "77px",
  resize: "none",
  fontSize: "1em",
  lineHeight: "1em",
  padding: ".5em",
  height: "77px",
  margin: "12px",
  border: "2px solid #eee",
  borderRadius: "8px",
  outline: 0
};
const styleLoading = {
  display: "flex",
  flex: "1",
  justifyContent: "center",
  alignItems: "center"
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
    isSending: false,
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

  // Helpers

  getAuthorName(authorId) {
    const contact = this.props.contacts[authorId];
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

  // API calls

  doSync = () => {
    this.setState({ isSyncing: true });

    return this.props
      .syncConversationMessages(this.props.activeConversationId)
      .finally(() => {
        this.setState({ isSyncing: false });
      });
  };

  doSend = message => {
    if (this.state.isSending) {
      return;
    }

    this.setState({ isSending: true });

    return this.props
      .sendMessage(this.props.activeConversationId, message)
      .then(() => this.setState({ textareaContent: "" }))
      .finally(() => this.setState({ isSending: false }));
  };

  // Event handlers

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

  // Rendering

  renderMessages = () => {
    if (this.state.isSyncing) {
      return <div style={styleLoading}>Syncing...</div>;
    }

    if (!this.props.messages.length) {
      return <div style={styleLoading}>No messages</div>;
    }

    return this.props.messages.map(message => {
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
      return <div className="conv-view" style={styleConvView} />;
    }

    return (
      <div className="conv-view" style={styleConvView}>
        <textarea
          autoFocus={true}
          rows="2"
          maxLength="307200"
          value={this.state.textareaContent}
          onChange={this.onTextareaChange}
          onKeyDown={this.onTextareaKey}
          placeholder={
            this.props.isTextareaDisabled
              ? "You are not a member of this conversation"
              : "Type your message"
          }
          disabled={this.props.isTextareaDisabled}
          style={styleTextarea}
        />
        <div className="message-list" style={styleMessageList}>
          {this.renderMessages()}
        </div>
      </div>
    );
  }
}
