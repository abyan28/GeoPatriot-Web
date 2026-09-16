import "fake-indexeddb/auto";

// Setup global untuk seluruh test: menyediakan implementasi IndexedDB palsu
// di environment Node agar lib/storage dapat diuji tanpa browser sungguhan.
