import React from "react";
import { defaultAvatar } from "../modules/userInfo";
import { addContact, getContacts } from "../modules/db";
import { start } from "../modules/p2p";

export default function ChatNewContact({ setContacts }) {
  const onSubmit = async (e) => {
    e.preventDefault();

    const { contact_id } = e.target.elements;

    console.log("add contact:" + contact_id.value);
    await addContact(contact_id.value, contact_id.value, defaultAvatar, false);

    console.log("get contacts after saving");

    contact_id.value = "";
    start()
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="input-group">
          <span className="input-group-text">
            <i className="fa fa-plus"></i>
          </span>
          <input
            type="text"
            id="contact_id"
            className="form-control"
            placeholder="Add NEAR contact..."
          />
        </div>
      </form>
    </>
  );
}
