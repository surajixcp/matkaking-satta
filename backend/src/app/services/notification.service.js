const admin = require('firebase-admin');

class NotificationService {
    constructor() {
        this.initialized = false;
        // this.init(); // Commented out until Firebase credentials are provided
    }

    init() {
        try {
            if (!process.env.FIREBASE_PROJECT_ID) return;

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            this.initialized = true;
            console.log('Firebase Notification Service Initialized');
        } catch (error) {
            console.error('Firebase Init Error:', error.message);
        }
    }

    /**
     * Send notification to a specific user
     */
    async sendToUser(deviceToken, title, body, data = {}) {
        if (!this.initialized || !deviceToken) {
            console.log(`[Mock Notification] User: ${title} - ${body}`);
            return;
        }

        try {
            await admin.messaging().send({
                token: deviceToken,
                notification: { title, body },
                data: { ...data, timestamp: new Date().toISOString() }
            });
        } catch (error) {
            console.error('Error sending user notification:', error.message);
        }
    }

    /**
     * Send notification to all admins (Topic: 'admin')
     */
    async sendToAdmins(title, body, data = {}) {
        if (!this.initialized) {
            console.log(`[Mock Notification] Admin: ${title} - ${body}`);
            return;
        }

        try {
            await admin.messaging().send({
                topic: 'admin',
                notification: { title, body },
                data
            });
        } catch (error) {
            console.error('Error sending admin notification:', error.message);
        }
    }
}

module.exports = new NotificationService();
