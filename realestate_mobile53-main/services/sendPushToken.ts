import axios from 'axios';
import { API_URL } from './api';

export async function sendPushTokenToBackend(token: string, userId: string) {
  try {
    await axios.post(`${API_URL}/push/register`, {
      token,
      userId,
    });
  } catch (err) {
    console.error('Failed to send push token to backend:', err);
  }
}
