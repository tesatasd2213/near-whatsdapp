import React from "react";

export default function SignIn({ wallet, nearConfig, contract }) {
  const signIn = () => {
    wallet.requestSignIn(
      {
        contractId: nearConfig.contractName,
        methodNames: ["createOffer", "createAnswer", "flushOffers", "flushAnswers"],
      }, //contract requesting access
      "NEAR Guest Book", //optional name
      null, //optional URL to redirect to if the sign in was successful
      null //optional URL to redirect to if the sign in was NOT successful
    );
  };

  return (
    <>
      <div className="container">
        <div className="row clearfix">
          <div className="col-lg-12">
            <div className="card chat-app p-5 text-center">
              <h1>WebRTC chat on NEAR!</h1>
              <em className="text-secondary">proof of concept version</em>
              <div className="col mx-auto">
                <button
                  className="btn btn-lg btn-primary mt-5"
                  onClick={signIn}
                >
                  Log in with NEAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
