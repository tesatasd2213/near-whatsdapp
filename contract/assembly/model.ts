import { context, storage, PersistentMap } from "near-sdk-as";

// Last negotiation identifier:
export let negotiationId = storage.getPrimitive<u64>("negotiationId", 0);

// Record of negotiations on the server:
@nearBindgen
export class Negotiation {
  // Identifier of this negotiation:
  id: u64;
  // User that created this negotiation:
  caller: string;
  // Target user that need to accept negotiation:
  callee: string;

  // Offer side SDP candidates:
  offerSdp: string;
  // Answer side SDP candidates:
  answerSdp: string;

  // Create new negitiation:
  constructor(callee: string) {
    this.id = negotiationId++;
    this.caller = context.predecessor;
    this.callee = callee;

    storage.set("negotiationId", negotiationId);
  }
}

// Export current map of negotiations (user to negotiation):
export const negotiations = new PersistentMap<u64,Negotiation>("negotiations-map");

// Export current map of offers (user to negotiation):
export const offers = new PersistentMap<string,Array<u64>>("offers-queue");
export const answers = new PersistentMap<string,Array<u64>>("answers-queue");