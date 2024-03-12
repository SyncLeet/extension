export function sendNotification(titleSlug: string, message: string): void {
    chrome.storage.sync.get('notificationStatus', (data) => {
        if (data.notificationStatus) {
            const notificationID = `${titleSlug}-${Date.now()}`
            chrome.notifications.create(notificationID, {
                type: "basic",
                iconUrl: "logo128.png",
                title: "SyncLeet",
                message: message,
            });
        }
    });
}