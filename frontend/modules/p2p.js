import "webrtc-adapter";
import { getContacts, updateContactOnline } from "./db";
import { initChannel } from "./peer";

// Define a map of offers:
export const offers = new Map();
// Define a map of peer connections:
export const connections = new Map();

// Define a map of peer data channels:
export const dataChannels = new Map();

// Define a map of media streams:
export const remoteTracks = new Map();
export const remoteStreams = new Map();

// Set media constraints for video chat:
const mediaConstraints = {
  audio: true, // We want an audio track
  video: {
    aspectRatio: {
      ideal: 1.333333, // 3:2 aspect is preferred
    },
  },
};
// Default ICE configuration:
const defaultIceConfig = {
  iceServers: [
    {
      url: "stun:stun.l.google.com:19302",
    },
  ],
};
// Stream audio/video:
let webcamStream;

// Start connections for current contacts.

export async function start(signalling) {
  console.log("attempt to create connections for the network");

  const contacts = await getContacts();
  for (const contact of contacts) {
    if (connections.has(contact.account_id) == false) {

      await updateContactOnline(contact.account_id, false);
      await createConnectionOffer(signalling, contact.account_id);
    }
  }

  console.log("connections created succesfully");
}

// Create new peer connection, send offer and wait for response from
// the other side of the connection.

export async function createConnectionOffer(signalling, id) {
  console.log(`create new connection for offer`);

  // Create new peer connection:
  const peerConnection = new RTCPeerConnection(defaultIceConfig);

  // Subscribe on peer events:
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  peerConnection.ontrack = handleTrackEvent;

  // Get access to the webcam stream:
  try {
    if (!webcamStream) {
      webcamStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
    }
  } catch (err) {
    handleGetUserMediaError(err);
  }

  // Add the tracks from the stream to the RTCPeerConnection
  try {
    webcamStream
      .getTracks()
      .forEach(
        (transceiver = (track) =>
          peerConnection.addTransceiver(track, { streams: [webcamStream] }))
      );
  } catch (err) {
    handleGetUserMediaError(err);
  }

  // Define data channel over WebRTC:
  const dataChannel = peerConnection.createDataChannel("events");

  // Called by the WebRTC layer to let us know when it's time to
  // begin, resume, or restart ICE negotiation.

  async function handleNegotiationNeededEvent() {
    log("*** Negotiation needed");

    try {
      log("---> Creating offer");
      const offer = await peerConnection.createOffer();

      // If the connection hasn't yet achieved the "stable" state,
      // return to the caller. Another negotiationneeded event
      // will be fired when the state stabilizes.

      if (peerConnection.signalingState != "stable") {
        log("     -- The connection isn't stable yet; postponing...");
        return;
      }

      // Establish the offer as the local peer's current
      // description.

      log("---> Setting local description to the offer");
      await peerConnection.setLocalDescription(offer);
    } catch (err) {
      log(
        "*** The following error occurred while handling the negotiationneeded event:"
      );
      reportError(err);
    }
  }

  // Called by the WebRTC layer when events occur on the media tracks
  // on our WebRTC call. This includes when streams are added to and
  // removed from the call.
  //
  // track events include the following fields:
  //
  // RTCRtpReceiver       receiver
  // MediaStreamTrack     track
  // MediaStream[]        streams
  // RTCRtpTransceiver    transceiver

  function handleTrackEvent(event) {
    log("*** Track event");

    remoteTracks.set(id, event.track);
    remoteStreams.set(id, event.streams);
  }

  // Handles |icecandidate| events by forwarding the specified
  // ICE candidate (created by our local ICE agent) to the other
  // peer through the signaling server.

  function handleICECandidateEvent(event) {
    if (event.candidate) {
      log("*** Outgoing ICE candidate: " + event.candidate.candidate);
    }
  }

  // Handle |iceconnectionstatechange| events. This will detect
  // when the ICE connection is closed, failed, or disconnected.
  //
  // This is called when the state of the ICE agent changes.

  function handleICEConnectionStateChangeEvent(event) {
    log(
      "*** ICE connection state changed to " + peerConnection.iceConnectionState
    );

    switch (peerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        closeConnection();
        break;
    }
  }

  // Set up a |signalingstatechange| event handler. This will detect when
  // the signaling connection is closed.
  //
  // NOTE: This will actually move to the new RTCPeerConnectionState enum
  // returned in the property RTCPeerConnection.connectionState when
  // browsers catch up with the latest version of the specification!

  function handleSignalingStateChangeEvent(event) {
    log(
      "*** WebRTC signaling state changed to: " + peerConnection.signalingState
    );

    switch (peerConnection.signalingState) {
      // Connection is stable, save:
      case "stable":
        if (connections.has(id) == true) {
          log("Close previous connection...");
          connections.get(id).close();
        }
        log("Save the connection!");
        connections.set(id, peerConnection);
        dataChannels.set(id, dataChannel);
        initChannel(signalling.accountId, id, dataChannel);
        break;

      case "closed":
        closeConnection();
        break;
    }
  }

  // Handle the |icegatheringstatechange| event. This lets us know what the
  // ICE engine is currently working on: "new" means no networking has happened
  // yet, "gathering" means the ICE engine is currently gathering candidates,
  // and "complete" means gathering is complete. Note that the engine can
  // alternate between "gathering" and "complete" repeatedly as needs and
  // circumstances change.
  //
  // We don't need to do anything when this happens, but we log it to the
  // console so you can see what's going on when playing with the sample.

  function handleICEGatheringStateChangeEvent(event) {
    log(
      "*** ICE gathering state changed to: " + peerConnection.iceGatheringState
    );

    if (peerConnection.iceGatheringState == "complete") {
      // Send the offer to the remote peer.

      log("---> Sending the offer to the remote peer");
      signalling.sendOffer(id, peerConnection.localDescription).then(
        offerId => offers.set(offerId, peerConnection)
      )
    }
  }

  // Close the RTCPeerConnection and reset variables so that the user can
  // make or receive another call if they wish. This is called both
  // when the user hangs up, the other user hangs up, or if a connection
  // failure is detected.

  function closeConnection() {
    log("Closing the call");

    // Close the RTCPeerConnection

    if (peerConnection) {
      log("--> Closing the peer connection");

      // Disconnect all our event listeners; we don't want stray events
      // to interfere with the hangup while it's ongoing.

      peerConnection.ontrack = null;
      peerConnection.onnicecandidate = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.onsignalingstatechange = null;
      peerConnection.onicegatheringstatechange = null;
      peerConnection.onnotificationneeded = null;

      // Stop all transceivers on the connection

      peerConnection.getTransceivers().forEach((transceiver) => {
        transceiver.stop();
      });

      // Close the peer connection

      peerConnection.close();
    }
  }

}

// Accept an offer to chat. We configure our local settings,
// create our RTCPeerConnection, get and attach our local camera
// stream, then create and send an answer to the caller.

export async function createConnectionForOffer(signalling, id, offerId, sdp) {

  // We need to set the remote description to the received SDP offer
  // so that our local WebRTC layer knows how to talk to the caller.

  const desc = new RTCSessionDescription(sdp);

  // Create new peer connection:
  const peerConnection = new RTCPeerConnection(defaultIceConfig);

  // Subscribe on peer events:
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.oniceconnectionstatechange =
    handleICEConnectionStateChangeEvent;
  peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  peerConnection.ontrack = handleTrackEvent;
  peerConnection.ondatachannel = handleDataChannel;

  // This method handles data channel opened from offer side.

  async function handleDataChannel(e) {
    dataChannels.set(id, e.channel);
    initChannel(signalling.accountId, id, e.channel);
  }

  log("---> Set offer");
  await peerConnection.setRemoteDescription(desc);
  log("---> Creating answer");
  const answer = await peerConnection.createAnswer();
  log("---> Setting local description to the answer");
  await peerConnection.setLocalDescription(answer);


  // Called by the WebRTC layer when events occur on the media tracks
  // on our WebRTC call. This includes when streams are added to and
  // removed from the call.
  //
  // track events include the following fields:
  //
  // RTCRtpReceiver       receiver
  // MediaStreamTrack     track
  // MediaStream[]        streams
  // RTCRtpTransceiver    transceiver

  function handleTrackEvent(event) {
    log("*** Track event");

    remoteTracks.set(id, event.track);
    remoteStreams.set(id, event.streams);
  }

  // Handles |icecandidate| events by forwarding the specified
  // ICE candidate (created by our local ICE agent) to the other
  // peer through the signaling server.

  function handleICECandidateEvent(event) {
    if (event.candidate) {
      log("*** Outgoing ICE candidate: " + event.candidate.candidate);
    }
  }

  // Handle |iceconnectionstatechange| events. This will detect
  // when the ICE connection is closed, failed, or disconnected.
  //
  // This is called when the state of the ICE agent changes.

  function handleICEConnectionStateChangeEvent(event) {
    log(
      "*** ICE connection state changed to " + peerConnection.iceConnectionState
    );

    switch (peerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        closeConnection();
        break;
    }
  }

  // Set up a |signalingstatechange| event handler. This will detect when
  // the signaling connection is closed.
  //
  // NOTE: This will actually move to the new RTCPeerConnectionState enum
  // returned in the property RTCPeerConnection.connectionState when
  // browsers catch up with the latest version of the specification!

  function handleSignalingStateChangeEvent(event) {
    log(
      "*** WebRTC signaling state changed to: " + peerConnection.signalingState
    );

    switch (peerConnection.signalingState) {
      case "stable":
        if (connections.has(id) == true) {
          log("Close previous connection...");
          connections.get(id).close();
          return;
        }
        log("Save the connection!");
        connections.set(id, peerConnection);
        break;
      case "closed":
        closeConnection();
        break;
    }
  }

  // Handle the |icegatheringstatechange| event. This lets us know what the
  // ICE engine is currently working on: "new" means no networking has happened
  // yet, "gathering" means the ICE engine is currently gathering candidates,
  // and "complete" means gathering is complete. Note that the engine can
  // alternate between "gathering" and "complete" repeatedly as needs and
  // circumstances change.
  //
  // We don't need to do anything when this happens, but we log it to the
  // console so you can see what's going on when playing with the sample.

  function handleICEGatheringStateChangeEvent(event) {
    log(
      "*** ICE gathering state changed to: " + peerConnection.iceGatheringState
    );

    if (peerConnection.iceGatheringState == "complete") {
      // Send the offer to the remote peer.

      log("---> Sending the anwser to the remote peer");
      signalling.sendAnswer(offerId, peerConnection.localDescription);
    }
  }

  // Close the RTCPeerConnection and reset variables so that the user can
  // make or receive another call if they wish. This is called both
  // when the user hangs up, the other user hangs up, or if a connection
  // failure is detected.

  function closeConnection() {
    log("Closing the call");

    // Close the RTCPeerConnection

    if (peerConnection) {
      log("--> Closing the peer connection");

      // Disconnect all our event listeners; we don't want stray events
      // to interfere with the hangup while it's ongoing.

      peerConnection.ontrack = null;
      peerConnection.onnicecandidate = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.onsignalingstatechange = null;
      peerConnection.onicegatheringstatechange = null;
      peerConnection.onnotificationneeded = null;

      // Stop all transceivers on the connection

      peerConnection.getTransceivers().forEach((transceiver) => {
        transceiver.stop();
      });

      // Close the peer connection

      peerConnection.close();
    }
  }

  // Get the webcam stream if we don't already have it

  if (!webcamStream) {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
    } catch (err) {
      handleGetUserMediaError(err);
    }

    // Add the camera stream to the RTCPeerConnection

    try {
      webcamStream
        .getTracks()
        .forEach(
          (transceiver = (track) =>
            peerConnection.addTransceiver(track, { streams: [webcamStream] }))
        );
    } catch (err) {
      handleGetUserMediaError(err);
    }
  }
}

// Accept answer from remote peer and set remote descriptor of the connection.

export async function acceptAnswer(id, sdp) {
  if (offers.has(id) == false) {
    log_error("incoming answer ignored, since not expect an answer");
    return;
  }

  // Get target peer connection:
  const peerConnection = offers.get(id);

  // We need to set the remote description to the received SDP offer
  // so that our local WebRTC layer knows how to talk to the caller.

  const desc = new RTCSessionDescription(sdp);

  // Set remote session description:
  await peerConnection.setRemoteDescription(desc);
}

// Handles reporting errors. Currently, we just dump stuff to console but
// in a real-world application, an appropriate (and user-friendly)
// error message should be displayed.

function reportError(errMessage) {
  log_error(`Error ${errMessage.name}: ${errMessage.message}`);
}

// Output logging information to console.

function log(text) {
  var time = new Date();

  console.log("[" + time.toLocaleTimeString() + "] " + text);
}

// Output an error message to console.

function log_error(text) {
  var time = new Date();

  console.trace("[" + time.toLocaleTimeString() + "] " + text);
}

// Handle errors which occur when trying to access the local media
// hardware; that is, exceptions thrown by getUserMedia(). The two most
// likely scenarios are that the user has no camera and/or microphone
// or that they declined to share their equipment when prompted. If
// they simply opted not to share their media, that's not really an
// error, so we won't present a message in that situation.

function handleGetUserMediaError(e) {
  log_error(e);
  switch (e.name) {
    case "NotFoundError":
      console.error(
        "Unable to open your call because no camera and/or microphone were found."
      );
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      console.error(
        "Error opening your camera and/or microphone: " + e.message
      );
      break;
  }
}
