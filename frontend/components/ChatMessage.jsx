import React, { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { avatar } from "../modules/userInfo";

export default function ChatMessage({ message }) {
  const [messageData, setMessageData] = useState({...message});
  const eventListeners = useRef();

  const dbUpdateMessageHandler = useCallback(
    (e) => {
      if (message.id == e.detail.id) {
        setMessageData(e.detail);
      }
    },
    [message]
  );

  useEffect(() => {
    window.removeEventListener(
      "db-update-message",
      eventListeners.dbUpdateMessage,
      true
    );

    eventListeners.dbUpdateMessage = dbUpdateMessageHandler;

    window.addEventListener(
      "db-update-message",
      eventListeners.dbUpdateMessage,
      true
    );
  }, [dbUpdateMessageHandler]);

  return (
    <>
      {messageData.type == "text" && (
        <>
          <div
            className={`message-data ${
              !messageData.incoming ? "text-end" : ""
            }`}
          >
            {messageData.status == "sending" ? (
              <i className="fa fa-spin fa-spinner"></i>
            ) : (
              ""
            )}
            {messageData.status == "sent" ? (
              <i className="fa fa-check"></i>
            ) : (
              ""
            )}
            {messageData.status == "read" ? (
              <i className="fa fa-check-circle"></i>
            ) : (
              ""
            )}
            <span className="message-data-time px-2">
              {moment(messageData.date).fromNow()}
            </span>
            { !messageData.incoming ? <img src={avatar} alt="avatar" /> : '' }
          </div>
          <div
            className={`message ${
              !messageData.incoming ? "my-message float-end" : "other-message"
            }`}
          >
            {messageData.text}
          </div>
        </>
      )}
      {messageData.type == "call" && (
        <>
          <div
            className={`message-data ${
              !messageData.incoming ? "text-end" : ""
            }`}
          >
            <span className="message-data-time px-2">
              {moment(messageData.date).fromNow()}
            </span>
            <img src={avatar} alt="avatar" />
          </div>
          <div
            className={`message message-call ${
              !messageData.incoming ? "my-message float-end" : "other-message"
            }`}
          >
            Video/audio call
          </div>
        </>
      )}
      {messageData.type == "deal" && (
        <>
          <div
            className={`message-data ${
              !messageData.incoming ? "text-end" : ""
            }`}
          >
            <span className="message-data-time px-2">
              {moment(messageData.date).fromNow()}
            </span>
            <img src={avatar} alt="avatar" />
          </div>
          <div
            className={`message bg-primary text-white ${
              !messageData.incoming ? "my-message float-end" : "other-message"
            }`}
          >
            <strong>Deal:</strong>
            <br />
            {messageData.text}
            <br />
            {messageData.accepted ? (
              ""
            ) : (
              <button className="btn btn-outline-light mt-2">
                <i className="fa fa-check"></i> Accept
              </button>
            )}
            {messageData.accepted ? (
              <span className="badge bg-light text-success mt-2">
                <i className="fa fa-check"></i> accepted
              </span>
            ) : (
              ""
            )}
          </div>
        </>
      )}
    </>
  );
}
