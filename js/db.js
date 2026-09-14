let opening;
const revisions = new Map();
export function db() {
  if (!opening) opening = new Promise((resolve, reject) => {
    const request = indexedDB.open('nor-apa-brew-control', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('batches', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { opening = null; reject(request.error); };
    request.onblocked = () => reject(new Error('Bitte andere geöffnete Brew-Control-Tabs schließen.'));
  });
  return opening;
}
export async function allBatches() {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction('batches').objectStore('batches').getAll();
    request.onsuccess = () => { for (const b of request.result) revisions.set(b.id,b.updatedAt); resolve(request.result.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))); };
    request.onerror = () => reject(request.error);
  });
}
export async function putBatch(batch) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('batches', 'readwrite');
    const store=tx.objectStore('batches');
    const request=store.get(batch.id);
    let conflict;
    request.onsuccess=()=>{
      if(request.result && request.result.updatedAt!==revisions.get(batch.id)) {
        conflict=new Error('Diese Charge wurde in einem anderen Tab geändert. Sichere deine offenen Daten und lade die Seite neu.');tx.abort();return;
      }
      try { store.put(batch); } catch(error) { conflict=error;tx.abort(); }
    };
    tx.oncomplete = () => { revisions.set(batch.id,batch.updatedAt);resolve(); };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(conflict || tx.error || new Error('Speichern abgebrochen.'));
  });
}
