import React from "react";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";


const styleApp = { display: "flex", maxHeight: "100%", height: "100%" };

export default class App extends React.Component {
  state = {
    activeConversationId: null
  };

  onChangeConversation = selectedConversationId => {
    this.setState({ activeConversationId: selectedConversationId });
  };

  render() {
    if (this.state.isLoading) {
      return <div>Loading...</div>;
    }
    return (
      <div className="app" style={styleApp}>
        <ConversationList
          activeConversationId={this.state.activeConversationId}
          onChangeConversation={this.onChangeConversation}
        />
        <Conversation activeConversationId={this.state.activeConversationId} />
      </div>
    );
  }
}
