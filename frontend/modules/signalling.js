import Big from 'big.js';
import { acceptAnswer, createConnectionForOffer } from './p2p';

// This class uses the connection to NEAR blockchain to send offers and answers.

export default class Signalling {
  constructor(contract, accountId) {
    this.contract = contract;
    this.accountId = accountId;
  }

  // Create new offer for a connection on NEAR.
  // Returns identifier of created offer:
  async sendOffer(accountId, sdp) {
    console.log(`Send offer to ${accountId}`);
    return await this.contract.createOffer(
      { callee: accountId, sdp: JSON.stringify(sdp) },
      Big(5)
        .times(10 ** 13)
        .toFixed()
    );
  }

  // Create an answer to outgoing connection:
  async sendAnswer(offerId, sdp) {
    console.log(`Send answer for offer ${offerId}`);
    const result = await this.contract.createAnswer(
      { id: offerId, sdp: JSON.stringify(sdp) },
      Big(5)
        .times(10 ** 13)
        .toFixed()
    );
    console.log(`Got answer result: ${result}`);
  }

  // Operate on connections:
  async operate() {
    console.log("** check incomings offers");
    const offersCount = await this.contract.countOffers({ account: this.accountId });
    console.log(`Received offers: ${offersCount}`);
    if (offersCount) {
        console.log("incoming offers found");
        const offers = await this.contract.flushOffers(
            {},
            Big(5)
               .times(10 ** 13)
               .toFixed()
        );
        console.log(`Got offers:`, offers);

        for (const offer of offers) {
            if (offer) {
                await createConnectionForOffer(
                    this,
                    this.accountId,
                    offer.id,
                    JSON.parse(offer.offerSdp)
                );
            }
        }
    }

    console.log("** check incomings answers");
    const answersCount = await this.contract.countAnswers({ account: this.accountId });
    console.log(`Received answers: ${answersCount}`);
    if (answersCount) {
        console.log("incoming answers found");
        const answers = await this.contract.flushAnswers(
            {},
            Big(5)
               .times(10 ** 13)
               .toFixed()
        );
        console.log(`Got answers:`, answers);

        for (const answer of answers) {
            if (answer) {
                await acceptAnswer(answer.id, JSON.parse(answer.answerSdp));
            }
        }
    }
  }
}
