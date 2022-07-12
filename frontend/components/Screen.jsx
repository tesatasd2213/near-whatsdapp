import React, { useEffect, useState } from "react";
import SignIn from "./SignIn";
import Personal from "./Personal";
import Call from "./Call";
import Chat from "./Chat";
import { userName } from "../modules/userInfo";

export default function Screen({
  contract,
  currentUser,
  nearConfig,
  wallet,
  screen,
  setScreen,
}) {
  const [call, setCall] = useState(null);

  useEffect(() => {
    if (userName == "Anonymous") {
      console.log("set screen to anonymous");
      setScreen("personal");
    }
  });

  return (
    <>
      {!currentUser && (
        <SignIn wallet={wallet} nearConfig={nearConfig} contract={contract} />
      )}
      {currentUser && screen == "personal" && (
        <Personal currentUser={currentUser} setScreen={setScreen} />
      )}
      {currentUser && screen == "chat" && (
        <Chat
          call={call}
          setCall={setCall}
          currentUser={currentUser}
          contract={contract}
          wallet={wallet}
          setScreen={setScreen}
        />
      )}
      {currentUser && screen == "call" && (
        <Call
          setCall={setCall}
          call={call}
          currentUser={currentUser}
          wallet={wallet}
          setScreen={setScreen}
        />
      )}
    </>
  );
}
