import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Code, 
  Cloud, 
  GitBranch, 
  Settings,
  Loader2
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentType?: string;
  actions?: string[];
}

interface ChatInterfaceProps {
  projectId?: number;
  className?: string;
}

export function ChatInterface({ projectId, className = "" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Ciao! Sono il tuo assistente AI per lo sviluppo autonomo. Dimmi cosa vuoi creare e mi occuperò di tutto.',
      timestamp: new Date(),
      actions: ['Crea nuovo progetto', 'Importa da GitHub', 'Deploy infrastruttura']
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/message", {
        message,
        projectId,
        context: 'development'
      });
      return response;
    },
    onSuccess: (response) => {
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: 'agent',
        content: response.response,
        timestamp: new Date(),
        agentType: response.agentType,
        actions: response.suggestedActions
      };
      setMessages(prev => [...prev, agentMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    handleSendMessage();
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Development Assistant
          {projectId && <Badge variant="outline">Progetto #{projectId}</Badge>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-3 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : message.type === 'agent'
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : message.type === 'agent' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <div className="text-sm font-medium mb-1">
                      {message.type === 'user' ? 'Tu' : 
                       message.type === 'agent' ? `Agent ${message.agentType || 'AI'}` : 'Sistema'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAction(action)}
                            className="text-xs"
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="rounded-lg p-3 bg-slate-100 dark:bg-slate-800">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      L'agente sta elaborando...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dimmi cosa vuoi sviluppare..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-2 flex gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction("Crea un sistema bancario completo")}
              className="text-xs"
            >
              <Code className="w-3 h-3 mr-1" />
              Sistema Bancario
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction("Deploy su AWS con Terraform")}
              className="text-xs"
            >
              <Cloud className="w-3 h-3 mr-1" />
              Deploy AWS
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction("Importa repository GitHub esistente")}
              className="text-xs"
            >
              <GitBranch className="w-3 h-3 mr-1" />
              Import GitHub
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}