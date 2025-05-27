import { useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = `ws://${window.location.host}/ws`,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const { toast } = useToast();

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
        onConnect?.();
        
        toast({
          title: "Connected",
          description: "Real-time updates are now available",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          setMessageHistory(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect if we haven't exceeded the limit
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
          
          toast({
            title: "Connection Lost",
            description: `Attempting to reconnect... (${reconnectCountRef.current}/${reconnectAttempts})`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Failed",
            description: "Unable to establish real-time connection. Please refresh the page.",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionStatus('error');
        onError?.(event);
        console.error('WebSocket error:', event);
      };

    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(messageWithTimestamp));
      return true;
    }
    return false;
  };

  const reconnect = () => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    sendMessage,
    reconnect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected',
    hasError: connectionStatus === 'error',
  };
}

// Hook for specific message types
export function useWebSocketSubscription(
  messageType: string,
  callback: (payload: any) => void,
  options: UseWebSocketOptions = {}
) {
  const { lastMessage, ...webSocket } = useWebSocket({
    ...options,
    onMessage: (message) => {
      if (message.type === messageType) {
        callback(message.payload);
      }
      options.onMessage?.(message);
    },
  });

  return webSocket;
}

// Hook for real-time dashboard updates
export function useDashboardUpdates() {
  const [updates, setUpdates] = useState<{
    agentStatus?: any;
    projectUpdate?: any;
    activityFeed?: any;
    systemMetrics?: any;
  }>({});

  const webSocket = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'agent_status_update':
          setUpdates(prev => ({ ...prev, agentStatus: message.payload }));
          break;
        case 'project_update':
          setUpdates(prev => ({ ...prev, projectUpdate: message.payload }));
          break;
        case 'new_activity':
          setUpdates(prev => ({ ...prev, activityFeed: message.payload }));
          break;
        case 'system_metrics':
          setUpdates(prev => ({ ...prev, systemMetrics: message.payload }));
          break;
      }
    },
  });

  return {
    ...webSocket,
    updates,
    clearUpdates: () => setUpdates({}),
  };
}
