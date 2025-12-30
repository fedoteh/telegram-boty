const messageHandler = (message: string = "") : string | null => {
  // Talk about la dotita if someone mentions "dotita"
  const dotaKeywords = ["dotita", "dota", "dotrulea", "dothraki", "dotubi", "navidota"]
  return dotaKeywords.some(keyword => message.toLowerCase().includes(keyword)) ? "La dotita 🙌" : null;
};

export default messageHandler;