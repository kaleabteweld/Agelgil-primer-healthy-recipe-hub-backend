import { initializeApp } from 'firebase-admin/app';
import { getMessaging, Message } from "firebase-admin/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyC5Zhqx-X_fHxR-ubTtoaaECxiAWsxvW7k",
    authDomain: "agelgil-3d5f5.firebaseapp.com",
    projectId: "agelgil-3d5f5",
    storageBucket: "agelgil-3d5f5.appspot.com",
    messagingSenderId: "570542015141",
    appId: "1:570542015141:web:0392d412641e33d8ac034c",
    measurementId: "G-X3BY437LY3"
};

initializeApp(firebaseConfig);

export async function sendPushNotification(message: Message) {
    try {
        const response = await getMessaging().send(message);
        return response
    } catch (error) {
        console.log("[-] sendPushNotification error ", error);
        throw error;
    }
}

export async function sendEach(messages: Message[]) {
    try {
        const responses = await Promise.all(
            messages.map(message => sendPushNotification(message))
        );
        return responses;
    } catch (error) {
        console.error("[-] sendEach error ", error);
        throw error;
    }
}


export class PushMessageBuilder {
    protected message: Message;

    constructor(token: string) {
        this.message = {
            token: token,
        };
    }

    setTitle(title: string): this {
        this.message.notification = this.message.notification || {};
        this.message.notification.title = title;
        return this;
    }

    setBody(body: string): this {
        this.message.notification = this.message.notification || {};
        this.message.notification.body = body;
        return this;
    }

    setData(data: { [key: string]: string }): this {
        this.message.data = data;
        return this;
    }

    build(): Message {
        return this.message;
    }
}

export class TopicMessageBuilder {

    protected message: Message;

    constructor(topic: string) {
        this.message = {
            topic: topic,
        };
    }

    setTitle(title: string): this {
        this.message.notification = this.message.notification || {};
        this.message.notification.title = title;
        return this;
    }

    setBody(body: string): this {
        this.message.notification = this.message.notification || {};
        this.message.notification.body = body;
        return this;
    }

    setData(data: { [key: string]: string }): this {
        this.message.data = data;
        return this;
    }

    build(): Message {
        return this.message;
    }
}
