import { serve, WebSocket } from "bun";

interface ClientMessage {
  action: string;
  symbol: string;
  streamType: string;
}

class Room {
  symbol: string;
  streamType: string;
  binanceWs: WebSocket | null;
  server: ReturnType<typeof serve>;

  constructor(symbol: string, streamType: string, server: ReturnType<typeof serve>) {
    this.symbol = symbol;
    this.streamType = streamType;
    this.binanceWs = null;
    this.server = server;
    this.connectToBinance();
  }

  connectToBinance(): void {
    const url = `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@${this.streamType}`;
    this.binanceWs = new WebSocket(url);

    this.binanceWs.onopen = () => {
      console.log(`Conectado à Binance: ${url}`);
    };

    this.binanceWs.onmessage = (event) => {
      this.broadcast(event.data);
    };

    this.binanceWs.onclose = () => {
      console.log(`Desconectado da Binance para ${this.symbol}. Tentando reconectar...`);
      setTimeout(() => this.connectToBinance(), 5000);
    };

    this.binanceWs.onerror = (error) => {
      console.error(`Erro na conexão com a Binance para ${this.symbol}:`, error);
      this.binanceWs?.close();
    };
  }

  broadcast(data: string | Uint8Array): void {
    this.server.publish(`${this.symbol}-${this.streamType}`, data);
  }

  close(): void {
    this.binanceWs?.close();
  }
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(symbol: string, streamType: string, server: ReturnType<typeof serve>): Room {
  const key = `${symbol}-${streamType}`;
  if (!rooms.has(key)) {
    rooms.set(key, new Room(symbol, streamType, server));
  }
  return rooms.get(key)!;
}

const server = serve({
  port: 3000,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("WebSocket Relay Server está rodando!");
  },
  websocket: {
    open(ws) {
      console.log("Cliente conectado");
    },
    message(ws: WebSocket, message: string) {
      try {
        const data = JSON.parse(message) as ClientMessage;
        if (data.action === "subscribe") {
          const { symbol, streamType } = data;
          const room = getOrCreateRoom(symbol, streamType, server);
          ws.subscribe(`${symbol}-${streamType}`);
          console.log(`Cliente inscrito em ${symbol}@${streamType}`);
        }
      } catch (error) {
        console.error("Erro ao processar mensagem do cliente:", error);
      }
    },
    close(ws) {
      console.log("Cliente desconectado");
    },
  },
});

console.log("WebSocket Relay Server rodando na porta 3000");