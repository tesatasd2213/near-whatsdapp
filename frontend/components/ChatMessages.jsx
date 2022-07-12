import React, { useState, useEffect, useRef, useCallback } from "react";
import moment from "moment";
import { addMessage, getContactInfo, getMessages } from "../modules/db";
import Big from "big.js";
import ChatMessage from "./ChatMessage";
import { peerSendMessage } from "../modules/peer";

export default function ChatMessages({ chat, currentUser, setChat, setScreen, setCall }) {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState({ name: "", avatar: "" });
  const [lastSeen, setLastSeen] = useState([]);

  const eventListeners = useRef();

  const dbNewMessageHandler = useCallback(
    (e) => {
      getMessages(chat).then((messages) => {
        setMessages(messages);
        const messagesContainer = document.getElementById("messagescontainer");

        const maxScrollTop =
            messagesContainer.scrollHeight - messagesContainer.offsetHeight,
          scrolledToBottom =
            Math.abs(messagesContainer.scrollTop - maxScrollTop) < 100;

        messagesContainer.scrollTo({ top: maxScrollTop, behavior: "smooth" });
      });
    },
    [chat]
  );

  useEffect(() => {
    window.removeEventListener(
      "db-new-message",
      eventListeners.dbNewMessage,
      true
    );

    eventListeners.dbNewMessage = dbNewMessageHandler;

    window.addEventListener(
      "db-new-message",
      eventListeners.dbNewMessage,
      true
    );
  }, [dbNewMessageHandler]);

  const postMessage = (e) => {
    e.preventDefault();

    const { messagetext } = e.target.elements;
    messagetext.disabled = true;

    addMessage(chat, false, "text", messagetext.value, "sending").then(
      (message) => {
        peerSendMessage(currentUser.accountId, message);

        messagetext.value = "";
        messagetext.focus();
        messagetext.disabled = false;
      }
    );
  };

  const sendCall = () => {
    setScreen("call");
    setCall(chat);
  };

  useEffect(() => {
    if (chat !== null) {
      console.log("get contact info:" + chat);
      getContactInfo(chat).then((data) => {
        setLastSeen(moment(data.updated_at).fromNow());
        setUser({ name: data.name, avatar: data.avatar });
      });

      getMessages(chat).then((messages) => {
        setMessages(messages);

        const messagesContainer = document.getElementById("messagescontainer");

        const maxScrollTop =
          messagesContainer.scrollHeight - messagesContainer.offsetHeight;

        messagesContainer.scrollTo({ top: maxScrollTop });
      });
    }
  }, [chat]);
  return (
    <>
      <div className="chat">
        {chat === null && (
          <div className="h-100 text-center flex">
            <div className="chat-history bg-secondary"></div>
          </div>
        )}
        {chat !== null && (
          <>
            <div className="chat-header clearfix">
              <div className="row">
                <div className="col-lg-6">
                  <a href="#" data-toggle="modal" data-target="#view_info">
                    <img src={user.avatar} alt="avatar" />
                  </a>
                  <div className="chat-about">
                    <h6 className="m-b-0">{user.name}</h6>
                    <small>Last seen: {lastSeen}</small>
                  </div>
                </div>
                <div className="col-lg-6 hidden-sm text-end">
                  <a
                    href="#"
                    onClick={sendCall}
                    className="btn btn-outline-success"
                  >
                    <i className="fa fa-phone"></i> Call
                  </a>
                  &nbsp;
                  <a
                    href="#"
                    onClick={() => setChat(null)}
                    className="btn btn-outline-secondary"
                  >
                    <i className="fa fa-times"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="chat-history" id="messagescontainer">
              <ul className="m-b-0">
                {messages.map((message, i) => (
                  <li className="clearfix" key={i}>
                    <ChatMessage message={message} />
                  </li>
                ))}
              </ul>
            </div>
            <form onSubmit={postMessage}>
              <div className="chat-message row clearfix">
                <div className="input-group mb-0 col">
                  <span className="input-group-text">
                    <i className="fa fa-send"></i>
                  </span>
                  <input
                    autoComplete="off"
                    type="text"
                    id="messagetext"
                    className="form-control"
                    placeholder="Enter text here..."
                  />
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
