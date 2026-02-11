import { useEffect, useRef } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const ConversationHistory = ({ messages, onClear }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageIcon = (type) => {
    switch (type) {
      case 'story_narration':
        return 'solar:book-2-bold-duotone';
      case 'user_question':
        return 'solar:user-bold-duotone';
      case 'ai_response':
        return 'solar:robot-bold-duotone';
      case 'story_modification':
        return 'solar:refresh-bold-duotone';
      case 'system_message':
        return 'solar:info-circle-bold-duotone';
      default:
        return 'solar:chat-round-bold-duotone';
    }
  };

  const getMessageVariant = (type) => {
    switch (type) {
      case 'story_narration':
        return 'primary';
      case 'user_question':
        return 'success';
      case 'ai_response':
        return 'info';
      case 'story_modification':
        return 'warning';
      case 'system_message':
        return 'secondary';
      default:
        return 'light';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="border">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <IconifyIcon icon="solar:chat-round-bold-duotone" width={20} height={20} className="me-2" />
          Conversation History
        </h6>
        {messages.length > 0 && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClear}
          >
            <IconifyIcon icon="solar:trash-bin-minimalistic-bold-duotone" width={16} height={16} />
          </Button>
        )}
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="text-center text-muted py-4">
            <IconifyIcon icon="solar:chat-round-bold-duotone" width={48} height={48} className="mb-2" />
            <p className="mb-0">No messages yet. Start speaking to begin the conversation.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`d-flex ${message.type === 'user_question' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-3 rounded ${
                    message.type === 'user_question'
                      ? 'bg-success bg-opacity-10'
                      : message.type === 'ai_response'
                      ? 'bg-info bg-opacity-10'
                      : 'bg-light'
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <IconifyIcon
                      icon={getMessageIcon(message.type)}
                      width={18}
                      height={18}
                      className={`text-${getMessageVariant(message.type)}`}
                    />
                    <Badge bg={getMessageVariant(message.type)} className="text-capitalize">
                      {message.type.replace('_', ' ')}
                    </Badge>
                    {message.timestamp && (
                      <small className="text-muted ms-auto">
                        {formatTime(message.timestamp)}
                      </small>
                    )}
                  </div>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </p>
                  {message.audioUrl && (
                    <audio
                      controls
                      src={message.audioUrl}
                      className="mt-2"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ConversationHistory;

