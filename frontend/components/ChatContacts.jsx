import React, { useCallback, useEffect, useRef } from "react";

import { removeContact, getContacts, clearMessages } from "../modules/db";

export default function ChatContacts({ chat, contacts, setContacts, setChat }) {
  const eventListeners = useRef();

  const dbNewContactHandler = useCallback((e) => {
    getContacts().then(setContacts);
  }, []);
  const dbUpdateContactHandler = useCallback((e) => {
    getContacts().then(setContacts);
  }, []);
  const dbRemoveContactHandler = useCallback((e) => {
    getContacts().then(setContacts);
  }, []);

  useEffect(() => {
    window.removeEventListener(
      "db-new-contact",
      eventListeners.dbNewContact,
      true
    );
    window.removeEventListener(
      "db-update-contact",
      eventListeners.dbUpdateContact,
      true
    );
    window.removeEventListener(
      "db-remove-contact",
      eventListeners.dbRemoveContact,
      true
    );

    eventListeners.dbNewContact = dbNewContactHandler;
    eventListeners.dbUpdateContact = dbUpdateContactHandler;
    eventListeners.dbRemoveContact = dbRemoveContactHandler;

    window.addEventListener(
      "db-new-contact",
      eventListeners.dbNewContact,
      true
    );
    window.addEventListener(
      "db-update-contact",
      eventListeners.dbUpdateContact,
      true
    );
    window.addEventListener(
      "db-remove-contact",
      eventListeners.dbRemoveContact,
      true
    );
  }, [dbNewContactHandler, dbUpdateContactHandler, dbRemoveContactHandler]);

  const onRemove = (account_id) => {
    const yes = confirm(
      `Are you sure you want to remove ${account_id} from your contacts list?`
    );
    if (yes) {
      removeContact(account_id).then(() => {
        clearMessages(account_id).then(() => {
          if (chat === account_id) {
            setChat(null);
          }
        });
      });
    }
  };

  return (
    <>
      {contacts.length == 0 && (
        <div className="p-3 py-5 my-5 text-center text-secondary">
          You have no active contacts, try to add one!
        </div>
      )}
      <ul className="list-unstyled chat-list mt-2 mb-0">
        {contacts.map((contact, i) => (
          <li
            key={i}
            className={`clearfix ${chat == contact.account_id ? "active" : ""}`}
            onClick={() => setChat(contact.account_id)}
          >
            {contact.badge > 0 ? (
              <span class="badge bg-danger">{contact.badge}</span>
            ) : (
              ""
            )}
            <img src={contact.avatar} alt="avatar" />
            <div className="about">
              <div className="name">{contact.name}</div>
              <div className="status">
                {" "}
                <i
                  className={`fa fa-circle ${
                    contact.online ? "online" : "offline"
                  }`}
                ></i>{" "}
                {contact.online ? "online" : "offline"}{" "}
              </div>
            </div>
            <button
              className="btn remove-btn btn-outline-danger btn-sm"
              onClick={() => onRemove(contact.account_id)}
            >
              <i className="fa fa-times"></i>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
