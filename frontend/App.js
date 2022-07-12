import "regenerator-runtime/runtime";
import React, { useState, useEffect } from "react";
import Screen from "./components/Screen";
import { start } from "./modules/p2p";
import Signalling from "./modules/signalling";


const App = ({ contract, currentUser, nearConfig, wallet }) => {
  let [screen, setScreen] = useState("chat");

  if (currentUser) {
    const signalling = new Signalling(contract, currentUser.accountId);

    signalling.operate().then(() => {
      start(signalling)
      // Iterate over operations on each 10 secs:
      setInterval(() => signalling.operate(), 10000);
    });
  }

  return (
    <main>
      <Screen
        contract={contract}
        currentUser={currentUser}
        nearConfig={nearConfig}
        wallet={wallet}
        screen={screen}
        setScreen={setScreen}
      />
    </main>
  );
};

export default App;
