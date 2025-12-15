const messageHandler = (message: string = "") : string | null => {
  // Talk about la dotita if someone mentions "dotita"
  return message.toLowerCase().includes("dotita") ? "La dotita" : null;
};

export default messageHandler;