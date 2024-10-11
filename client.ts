interface SubscribeMessage {
    action: string;
    symbol: string;
    streamType: string;
  }
  
  const ws = new WebSocket("ws://localhost:3000");
  
  ws.onopen = () => {
    console.log("Conectado ao servidor de retransmissão");
  
    // Exemplo de como se inscrever em um stream
    const subscribeMessage: SubscribeMessage = {
      action: "subscribe",
      symbol: "btcusdt",
      streamType: "trade"
    };
    ws.send(JSON.stringify(subscribeMessage));
    console.log("Inscrição enviada para btcusdt@trade");
  
    // Exemplo de como mudar o stream após 10 segundos
    setTimeout(() => {
      const newSubscribeMessage: SubscribeMessage = {
        action: "subscribe",
        symbol: "ethusdt",
        streamType: "trade"
      };
      ws.send(JSON.stringify(newSubscribeMessage));
      console.log("Inscrição alterada para ethusdt@trade");
    }, 10000);
  };
  
  ws.onmessage = (event: MessageEvent) => {
    console.log("Dados recebidos:", event.data);
  };
  
  ws.onclose = () => {
    console.log("Desconectado do servidor de retransmissão");
  };
  
  ws.onerror = (error: Event) => {
    console.error("Erro na conexão com o servidor:", error);
  };