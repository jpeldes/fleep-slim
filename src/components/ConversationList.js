import React from "react";
import { syncConversations } from "../api";

const styleConversation = isActive => {
  return {
    backgroundColor: isActive ? "#eee" : "#fff",
    padding: "6px 6px 6px 12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    borderTop: "1px solid #ccc"
  };
};

const styleConvList = {
  flex: 1,
  borderRight: "1px solid #ccc",
  overflow: "auto",
  paddingBottom: "5em"
};

class ConversationListItem extends React.PureComponent {
  onClick = () => this.props.onClick(this.props.conversationId);

  render() {
    return (
      <div
        style={styleConversation(this.props.isActive)}
        onClick={this.onClick}
        title={this.props.topic}
      >
        {this.props.topic}
      </div>
    );
  }
}

export default class ConversationList extends React.Component {
  state = {
    conversations: []
  };

  componentDidMount() {
    syncConversations()
      .then(conversations => {
        this.setState({ conversations });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  render() {
    return (
      <div
          className="conv-list"
          style={styleConvList}
        >
        <h2 style={{ textAlign: "center" }}>Fleep</h2>
        <div>
          {this.state.conversations.map(conv => (
            <ConversationListItem
              key={conv.conversation_id}
              conversationId={conv.conversation_id}
              onClick={this.props.onChangeConversation}
              topic={conv.topic || conv.default_topic || conv.conversation_id}
              isActive={
                this.props.activeConversationId === conv.conversation_id
              }
            />
          ))}
        </div>
      </div>
    );
  }
}
