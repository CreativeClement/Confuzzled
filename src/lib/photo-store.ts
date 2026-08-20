import type { ClarifyImageMime } from "@/lib/image-payload";

/**
 * Named before the product settled on "Confuzzle". Renaming the database would
 * orphan every photo already saved on a reader's device, so the name stays.
 */
export const PHOTO_DB = "confuzzled";
export const PHOTO_STORE = "photos";

export type StoredPhoto = {
  id: string;
  name: string;
  mime: ClarifyImageMime;
  data: string;
  preview: string;
};

function openPhotos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open photo storage."));
  });
}

export async function putPhoto(photo: StoredPhoto): Promise<void> {
  const db = await openPhotos();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save that photo."));
    tx.objectStore(PHOTO_STORE).put(photo);
  });
  db.close();
}

export async function getPhoto(id: string): Promise<StoredPhoto | null> {
  const db = await openPhotos();
  const photo = await new Promise<StoredPhoto | null>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const request = tx.objectStore(PHOTO_STORE).get(id);
    request.onsuccess = () => resolve((request.result as StoredPhoto | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not read that photo."));
  });
  db.close();
  return photo;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openPhotos();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not delete that photo."));
    tx.objectStore(PHOTO_STORE).delete(id);
  });
  db.close();
}

export async function clearPhotos(): Promise<void> {
  const db = await openPhotos();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not clear photos."));
    tx.objectStore(PHOTO_STORE).clear();
  });
  db.close();
}
