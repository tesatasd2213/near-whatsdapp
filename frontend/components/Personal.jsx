import React, { useEffect, useState } from "react";
import { peerSendMe } from "../modules/peer";
import {
  userName,
  avatar,
  defaultAvatar,
  updateInfo,
} from "../modules/userInfo";

export default function Personal({ currentUser, setScreen }) {
  const [currentUserName, setCurrentUserName] = useState(currentUser.accountId);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);

  const onAvatarSelect = (e) => {
    if (e.target.files.length) {
      const fileReader = new FileReader();

      fileReader.onload = function (fileLoadedEvent) {
        console.log("set avatar");
        setCurrentAvatar(fileLoadedEvent.target.result);
      };

      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    console.log("update info");
    updateInfo(currentUserName, currentAvatar);
    peerSendMe(currentUser.accountId);

    setScreen("chat");
  };

  return (
    <>
      <div className="container">
        <div className="row clearfix">
          <div className="col-lg-12">
            <form onSubmit={onSubmit}>
              <div className="card chat-app p-5 text-center">
                <h1>Public information:</h1>
                <div className="col-6 mt-3 mx-auto">
                  <div className="input-group">
                    <span className="input-group-text">Your name:</span>
                    <input
                      id="username"
                      required
                      value={currentUserName}
                      onChange={(e) => setCurrentUserName(e.target.value)}
                      type="text"
                      className="form-control"
                      placeholder="Will be displayed for other users"
                    />
                  </div>
                  <div className="input-group mt-4">
                    <span className="input-group-text">Photo:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onAvatarSelect}
                      id="avatarfile"
                      className="form-control"
                    />
                  </div>
                  <div className="card col mx-auto mt-4">
                    <strong>Others will see you as:</strong>
                    <ul className="list-unstyled chat-list mt-2 mb-0">
                      <li className="clearfix">
                        <img src={currentAvatar} alt="avatar" />
                        <div className="about text-center">
                          <div className="name">{currentUserName}</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="col mx-auto">
                    <button
                      type="sumbit"
                      className="btn btn-lg btn-primary mt-2"
                    >
                      Save and proceed
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
