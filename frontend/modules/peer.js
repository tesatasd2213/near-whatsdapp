import { addMessage, markMessagesAsSent, updateContact, updateContactOnline } from "./db";
import { dataChannels } from "./p2p";
import { userName, avatar } from "./userInfo";

// This function initializes data channel between two peers:

export function initChannel(me, accountId, dataChannel) {
    // Message got:

    dataChannel.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('receive:', data);

        switch (data.type) {
            case "me":
                updateContact(data.sender, data.content.name, data.content.avatar);
                break;
            
            case "message":
                addMessage(data.sender, true, "text", data.content.text, "sent");
                peerReceiveMessage(data.sender, data.content);
                break;
            
            case "message-received":
                markMessagesAsSent(data.content.id);
                break;
        }
    };

    // Connected:

    dataChannel.onopen = () => {
        // Set info about me to the channel:
        dataChannel.send(JSON.stringify(
            { type: "me", sender: me, content: {"name": userName, "avatar": avatar} }
        ));

        updateContactOnline(accountId, true);

    }

    // Disconnected:

    dataChannel.onclose = () => {
        updateContactOnline(accountId, false);
    };
}

export function peerSendMe(accountId) {
    for ( const dc of dataChannels.values()) {
        // Set info about me to the channel:
        dc.send(JSON.stringify(
            { type: "me", sender: accountId, content: {"name": userName, "avatar": avatar} }
        ));
    }
}

export function peerSendMessage(accountId, message) {
    if (dataChannels.has(message.account_id)) {
        const dc = dataChannels.get(message.account_id);

        dc.send(JSON.stringify({
            type: "message", sender: accountId, content: message
        }));
    }
}

export function peerReceiveMessage(accountId, message) {
    if (dataChannels.has(message.account_id)) {
        const dc = dataChannels.get(message.account_id);

        dc.send(JSON.stringify({
            type: "message-received", sender: accountId, content: message
        }));
    }
}