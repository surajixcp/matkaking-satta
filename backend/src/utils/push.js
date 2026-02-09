const admin = require("../config/firebase");

/**
 * Send a push notification to a single device
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload (values must be strings)
 */
async function sendPush(token, title, body, data = {}) {
    try {
        const message = {
            token,
            notification: {
                title,
                body,
            },
            data,
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

/**
 * Send a push notification to a topic
 * @param {string} topic - Topic name (e.g., 'results', 'kalyan')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
async function sendToTopic(topic, title, body, data = {}) {
    try {
        const message = {
            topic,
            notification: {
                title,
                body,
            },
            data,
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message to topic:", response);
        return response;
    } catch (error) {
        console.error("Error sending message to topic:", error);
        throw error;
    }
}

module.exports = {
    sendPush,
    sendToTopic,
};
