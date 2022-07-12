import React, { useEffect, useState } from "react";
import { getContactInfo } from "../modules/db";

export default function Call({ call, setCall, setScreen }) {
  const [user, setUser] = useState({ name: "", avatar: "" });
  const [status, setStatus] = useState("Ringing...");
  const [mute, setMute] = useState(false);

  useEffect(() => {
    if (call !== null) {
      console.log("get contact info:" + call);
      getContactInfo(call).then((data) => {
        setUser({ name: data.name, avatar: data.avatar });
      });
    }
  }, [call]);

  return (
    <>
      <div className="container">
        <div className="row clearfix">
          <div className="col-lg-12">
            <div className="card chat-app p-5 bg-black text-center">
              <div className="card mx-auto">
                <div className="row">
                  <div className="clearfix">
                    <div className="row">
                      <div className="col-lg-6 row text-start px-4">
                        <div className="col-2 mt-3 text-end">
                          <img src={user.avatar} alt="avatar" className="ava" />
                        </div>
                        <div className="col mt-3">
                          <div className="chat-about pl-5">
                            <h6 className="m-b-0">{user.name}</h6>
                            <small>{status}</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6 p-4 text-end">
                        <a
                          href="#"
                          onClick={() => {
                            setCall(null);
                            setScreen("chat");
                          }}
                          className="btn btn-outline-danger"
                        >
                          <i className="fa fa-phone"></i> Hang up
                        </a>
                        &nbsp;
                        <a
                          href="#"
                          className={`btn ${
                            mute ? "btn-secondary" : "btn-outline-secondary"
                          }`}
                          onClick={() => setMute(!mute)}
                        >
                          <i className="fa fa-volume-mute"></i> Mute
                        </a>
                      </div>
                    </div>
                    <div className="row video-wrap">
                      <video id="bigcanvas"></video>
                      <video id="smallcanvas"></video>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
