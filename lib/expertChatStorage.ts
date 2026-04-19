import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@AgroConnect/expert_thread_v1/';

export type ExpertChatMessage = {
  id: string;
  from: 'user' | 'expert';
  text: string;
  at: string;
};

function key(expertId: string): string {
  return `${PREFIX}${expertId}`;
}

export async function loadExpertThread(expertId: string): Promise<ExpertChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(key(expertId));
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as ExpertChatMessage[]) : [];
  } catch {
    return [];
  }
}

export async function saveExpertThread(expertId: string, messages: ExpertChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(key(expertId), JSON.stringify(messages.slice(-200)));
}

export async function clearExpertThread(expertId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(expertId));
  } catch {
    /* */
  }
}
