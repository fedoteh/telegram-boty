// TODO: This cache will grow indefinitely. Implement a strategy to limit its size.
const cache = new Map<string, string>();

const buildKey = (chatId: number, messageId: number) => `${chatId}:${messageId}`;

export const rememberMessageText = (chatId?: number, messageId?: number, text?: string) => {
  if (chatId === undefined || messageId === undefined || typeof text !== "string") {
    return;
  }

  cache.set(buildKey(chatId, messageId), text);
};

export const hasMessageTextChanged = (chatId?: number, messageId?: number, text?: string) => {
  if (chatId === undefined || messageId === undefined || typeof text !== "string") {
    return false;
  }

  const key = buildKey(chatId, messageId);
  const previous = cache.get(key);

  if (previous === undefined) {
    cache.set(key, text);
    return false;
  }

  if (previous === text) {
    return false;
  }

  cache.set(key, text);
  return true;
};
