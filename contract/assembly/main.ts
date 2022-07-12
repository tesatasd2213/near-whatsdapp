import { context } from 'near-sdk-as';
import { Negotiation, negotiations, offers, answers } from './model';

// This function creates new offer with SDP candidates:
export function createOffer(callee: string, sdp: string): u64 {
  // Create new negotiation for this offer:
  const negotiation = new Negotiation(callee);
  // Save sdp for an answer:
  negotiation.offerSdp = sdp;
  // Save negotiation in the store:
  negotiations.set(negotiation.id, negotiation);
  // Create offer queue:
  if (offers.contains(callee) == false) {
    offers.set(callee, []);
  }
  // Add offer to queue:
  const calleeOffers = offers.getSome(callee);
  calleeOffers.push(negotiation.id);
  // Save offers:
  offers.set(callee, calleeOffers);
  // Return created negotiation id:
  return negotiation.id
}

// This function creates new answer for offer with passed id: 
export function createAnswer(id: u64, sdp: string): boolean {
  // Check if negotiation does exist:
  if (negotiations.contains(id)) {
    // Get negotiation's object:
    const negotiation = negotiations.getSome(id);
    // Get current caller:
    const caller = negotiation.caller
    // Set spd for an answer:
    negotiation.answerSdp = sdp;
    // Save edited negotiation:
    negotiations.set(id, negotiation);
    // Create offer queue:
    if (answers.contains(caller) == false) {
      answers.set(caller, []);
    }
    // Add answer to queue:
    const callerAnswers = answers.getSome(caller);
    callerAnswers.push(negotiation.id);
    // Save answers:
    answers.set(caller, callerAnswers);
    return true;
  }
  return false;
}

// This view function returns number of offers in the queue:
export function countOffers(account: string): number {
  if (offers.contains(account)) {
    return offers.getSome(account).length;
  }
  return 0
}

// This function flushes and returns 10 last offers from the queue:
export function flushOffers(): (Negotiation | null)[] {
  // Get array of offers:
  const yourOffers = offers.getSome(context.predecessor);
  // Prepare results:
  const maxOffers = min(3, yourOffers.length);
  const result = new Array<Negotiation | null>(maxOffers);

  // Get last negotiation from the array:
  for(let i = 0; i < maxOffers; i++) {
    const id = yourOffers.pop();
    if (negotiations.contains(id)) {
      const negotiation = negotiations.getSome(id);
      
      result[i] = negotiation;
    }
  }

  // Save changes:
  offers.set(context.predecessor, yourOffers);

  return result;
}

// This view function returns number of answers in the queue:
export function countAnswers(account: string): number {
  if (answers.contains(account)) {
    return answers.getSome(account).length;
  }
  return 0
}

// This function flushes and returns 10 last answers from the queue
// and clears stored negotiation:
export function flushAnswers(): (Negotiation | null)[] {
  // Get array of offers:
  const yourAnswers = answers.getSome(context.predecessor);
  // Prepare results:
  const numMessages = min(3, yourAnswers.length);
  const result = new Array<Negotiation | null>(numMessages);

  // Get last negotiation from the array:
  for(let i = 0; i < numMessages; i++) {
    const id = yourAnswers.pop();

    if (negotiations.contains(id)) {
      const negotiation = negotiations.getSome(id);
      // Remote negotiation from the storage:
      negotiations.delete(id);

      result[i] = negotiation;
    }
  }

  // Save changes:
  answers.set(context.predecessor, yourAnswers);

  return result;
}