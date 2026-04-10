import { CapacitorHttp } from '@capacitor/core';
import { TelegramMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const fetchTelegramMessages = async (channelUsername: string): Promise<TelegramMessage[]> => {
  try {
    const response = await CapacitorHttp.get({
      url: `https://t.me/s/${channelUsername}`,
    });

    if (response.status !== 200) {
      throw new Error('Channel not found');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.data, 'text/html');
    const messages: TelegramMessage[] = [];

    const messageElements = doc.querySelectorAll('.tgme_widget_message_wrap');
    
    messageElements.forEach((el) => {
      const id = el.querySelector('.tgme_widget_message')?.getAttribute('data-post') || uuidv4();
      const text = el.querySelector('.tgme_widget_message_text')?.textContent || '';
      const dateStr = el.querySelector('time')?.getAttribute('datetime');
      const date = dateStr ? new Date(dateStr).getTime() : Date.now();
      const imageUrl = el.querySelector('.tgme_widget_message_photo_wrap')?.getAttribute('style')?.match(/url\('(.*)'\)/)?.[1];

      messages.push({
        id,
        channelId: channelUsername,
        text,
        date,
        imageUrl,
      });
    });

    return messages;
  } catch (error) {
    console.error('Error fetching Telegram messages:', error);
    throw error;
  }
};
