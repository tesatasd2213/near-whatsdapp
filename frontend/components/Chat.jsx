import React, { useCallback, useEffect, useRef, useState } from "react";
import { clearInfo, defaultAvatar } from "../modules/userInfo";
import ChatContacts from "./ChatContacts";
import ChatNewContact from "./ChatNewContact";
import ChatMessages from "./ChatMessages";
import { clearAllMessages, clearContacts, getContacts } from "../modules/db";

export default function Chat({ currentUser, wallet, setCall, setScreen }) {
  const [contacts, setContacts] = useState([]);
  const [chat, setChat] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [caller, setCaller] = useState({
    id: null,
    name: "Unknown",
    avatar: defaultAvatar,
  });

  const eventListeners = useRef();

  const callHandler = useCallback((e) => {
    setCaller({
      id: e.detail.id,
      name: e.detail.name,
      avatar: e.delail.avatar,
    });
    setIncomingCall(true);
  }, []);

  useEffect(() => {
    window.removeEventListener("webrtc-call", eventListeners.call, true);

    eventListeners.call = callHandler;

    window.addEventListener("webrtc-call", eventListeners.call, true);
  }, [callHandler]);

  useEffect(() => {
    console.log("get contacts in chat");
    getContacts().then(setContacts);
  }, []);

  const signOut = () => {
    clearInfo();
    clearContacts();
    clearAllMessages();
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <>
      <div className="container">
        <div className="row clearfix">
          <div className="col-lg-12">
            <div className="card chat-app">
              <div id="plist" className="people-list">
                <div className="card p-2">
                  Hello,
                  <small className="text-secondary">
                    {currentUser.accountId}
                  </small>
                  <a
                    href="#"
                    className="btn btn-sm btn-outline-primary mt-1"
                    onClick={() => setScreen("personal")}
                  >
                    Edit profile
                  </a>
                  <a
                    href="#"
                    className="btn btn-sm btn-outline-danger mt-1"
                    onClick={signOut}
                  >
                    Log out
                  </a>
                </div>

                <ChatNewContact setContacts={setContacts} />

                <ChatContacts
                  setContacts={setContacts}
                  chat={chat}
                  contacts={contacts}
                  setChat={setChat}
                />
              </div>
              <ChatMessages
                setCall={setCall}
                setScreen={setScreen}
                contacts={contacts}
                chat={chat}
                setChat={setChat}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`modal ${incomingCall ? "modal-active" : ""}`}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Incoming audio/video call</h5>
            </div>
            <div className="modal-body">
              <ul className="list-unstyled chat-list mt-2 mb-0">
                <li className="clearfix text-center">
                  <img src={caller.avatar} alt="avatar" />
                  <div className="about text-center">
                    <div className="name">{caller.name}</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  setCall(caller.id);
                  setScreen("call");
                  setIncomingCall(false);
                }}
              >
                <i className="fa fa-phone"></i> Accept
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setIncomingCall(false)}
              >
                <i className="fa fa-phone"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
