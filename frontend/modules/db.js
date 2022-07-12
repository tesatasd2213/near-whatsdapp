let openRequest = indexedDB.open("store", 1);
let resolveDatabasePromise;

export const databasePromise = new Promise(
  (resolve) => (resolveDatabasePromise = resolve)
);

openRequest.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("contacts", { keyPath: "account_id" });

  const messagesStore = db.createObjectStore("messages", {
    keyPath: "id",
    autoIncrement: true,
  });
  messagesStore.createIndex("account_id", "account_id", { unique: false });
};

openRequest.onerror = function () {
  console.error("Error", openRequest.error);
};

openRequest.onsuccess = function () {
  let db = openRequest.result;

  db.onversionchange = function () {
    db.close();
    window.location.reload();
  };

  resolveDatabasePromise(db);
};

export async function addContact(account_id, name, avatar) {
  const contact = {
    account_id,
    name,
    badge: 0,
    avatar,
    online: false,
    updated_at: new Date(),
  };

  const db = await databasePromise;
  const request = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts")
    .add(contact);

  await new Promise((resolve) => (request.onsuccess = resolve));

  const event = new CustomEvent("db-new-contact", { detail: contact });
  window.dispatchEvent(event);
}

export async function getContacts() {
  const db = await databasePromise;
  const request = db.transaction(["contacts"]).objectStore("contacts").getAll();

  return await new Promise(
    (resolve) =>
      (request.onsuccess = (e) =>
        resolve(
          e.target.result.sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          )
        ))
  );
}

export async function getContactInfo(account_id) {
  const db = await databasePromise;
  const request = db
    .transaction(["contacts"])
    .objectStore("contacts")
    .get(account_id);

  return await new Promise(
    (resolve) => (request.onsuccess = (e) => resolve(e.target.result))
  );
}

export async function updateContact(account_id, name, avatar) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts");

  const request = transaction.get(account_id);

  return await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const data = e.target.result;
        data.name = name;
        data.avatar = avatar;
        data.updated_at = new Date();

        const putRequest = transaction.put(data);

        putRequest.onsuccess = () => {
          resolve(data);

          const event = new CustomEvent("db-update-contact", { detail: data });
          window.dispatchEvent(event);
        };
      })
  );
}

export async function updateContactOnline(account_id, state) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts");

  const request = transaction.get(account_id);

  return await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const data = e.target.result;
        data.online = state;
        data.updated_at = new Date();

        const putRequest = transaction.put(data);

        putRequest.onsuccess = () => {
          resolve(data);

          const event = new CustomEvent("db-update-contact", { detail: data });
          window.dispatchEvent(event);
        };
      })
  );
}

export async function incrementContactUnreadCounter(account_id) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts");

  const request = transaction.get(account_id);

  return await new Promise(
    (resolve) =>
      (request.oncomplete = (e) => {
        const data = e.target.result;
        data.badge += 1;
        data.updated_at = new Date();

        const putRequest = transaction.put(data);

        putRequest.onsuccess = () => {
          resolve(data);

          const event = new CustomEvent("db-update-contact", { detail: data });
          window.dispatchEvent(event);
        };
      })
  );
}

export async function markContactAsRead(account_id) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts");

  const request = transaction.get(account_id);

  return await new Promise(
    (resolve) =>
      (request.oncomplete = (e) => {
        const data = e.target.result;
        data.badge = 0;
        data.updated_at = new Date();

        const putRequest = transaction.put(data);

        putRequest.onsuccess = () => {
          resolve(data);

          const event = new CustomEvent("db-update-contact", { detail: data });
          window.dispatchEvent(event);
        };
      })
  );
}

export async function removeContact(account_id) {
  const db = await databasePromise;
  const request = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts")
    .delete(account_id);

  await new Promise((resolve) => (request.onsuccess = resolve));

  const event = new CustomEvent("db-remove-contact", { detail: account_id });
  window.dispatchEvent(event);
}

export async function clearContacts() {
  const db = await databasePromise;
  const transaction = db
    .transaction(["contacts"], "readwrite")
    .objectStore("contacts")
    .clear();

  await new Promise((resolve) => (transaction.oncomplete = resolve));

  const event = new CustomEvent("db-remove-contacts");
  window.dispatchEvent(event);
}

export async function addMessage(account_id, incoming, type, text, status) {
  const db = await databasePromise;
  const message = {
    account_id,
    incoming,
    type,
    text,
    status,
    date: new Date(),
  };
  const request = db
    .transaction(["messages"], "readwrite")
    .objectStore("messages")
    .add(message);

  const res = await new Promise((resolve) => (request.onsuccess = resolve));

  message.id = res.target.result;

  const event = new CustomEvent("db-new-message", { detail: message });
  window.dispatchEvent(event);

  return message;
}

export async function getMessages(account_id) {
  const db = await databasePromise;
  const request = db
    .transaction(["messages"])
    .objectStore("messages")
    .index("account_id")
    .openCursor(IDBKeyRange.only(account_id));

  const messages = [];

  await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      })
  );

  return messages.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function getMessagesToSend(account_id) {
  const db = await databasePromise;
  const request = db
    .transaction(["messages"])
    .objectStore("messages")
    .index("account_id")
    .openCursor(IDBKeyRange.only(account_id));

  const messages = [];

  await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.status == "sending") {
            messages.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve();
        }
      })
  );

  return messages.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function markMessagesAsRead(account_id, max_id = Infinity) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["messages"], "readwrite")
    .objectStore("messages");

  const request = transaction
    .index("account_id")
    .openCursor(IDBKeyRange.only(account_id));

  await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.id <= max_id) {
            const dataToUpdate = cursor.value;
            dataToUpdate.status = "read";

            const request = cursor.update(dataToUpdate);
            request.onsuccess = () => {
              const event = new CustomEvent("db-update-message", {
                detail: dataToUpdate,
              });
              window.dispatchEvent(event);

              cursor.continue();
            };
          } else {
            cursor.continue();
          }
        } else {
          resolve();
        }
      })
  );
}

export async function markMessagesAsSent(id) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["messages"], "readwrite")
    .objectStore("messages");

  const request = transaction.get(id);

  request.onerror = console.error;

  return await new Promise(
    (resolve) =>
      (request.onsuccess = (e) => {
        const data = e.target.result;
        data.status = "sent";

        const puReq = transaction.put(data);

        puReq.onsuccess = () => {
          resolve(data);

          const event = new CustomEvent("db-update-message", {
            detail: data,
          });
          window.dispatchEvent(event);
        };
      })
  );
}

export async function clearMessages(account_id) {
  const db = await databasePromise;
  const transaction = db
    .transaction(["messages"], "readwrite")
    .objectStore("messages")
    .index("account_id")
    .openCursor(IDBKeyRange.only(account_id));

  await new Promise(
    (resolve) =>
      (transaction.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const request = cursor.delete();
          request.onsuccess = () => {
            cursor.continue();
          };
        } else {
          resolve();
        }
      })
  );
}

export async function clearAllMessages() {
  const db = await databasePromise;
  const transaction = db
    .transaction(["messages"], "readwrite")
    .objectStore("messages")
    .clear();

  await new Promise((resolve) => (transaction.oncomplete = resolve));
}
