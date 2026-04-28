import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const AIChatbot = () => {
    const { user, axios, currency, navigate } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history when opened
    useEffect(() => {
        if (isOpen && user && messages.length === 0) {
            loadChatHistory();
        }
    }, [isOpen, user]);

    const loadChatHistory = async () => {
        try {
            const { data } = await axios.get('/api/ai/chat-history');
            if (data.success && data.messages.length > 0) {
                setMessages(data.messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })));
                setShowQuickActions(false);
            }
        } catch (e) { /* Ignore */ }
    };

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage = { role: 'user', content: text };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setShowQuickActions(false);

        try {
            const { data } = await axios.post('/api/ai/chat', {
                message: text,
                conversationHistory: newMessages.slice(-8),
            });

            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply,
                    suggestedProducts: data.suggestedProducts,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message || "Sorry, I'm having trouble right now. Please try again!",
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Oops! I couldn't connect to the server. Please try again later.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
        setMessages([]);
        setShowQuickActions(true);
        try {
            await axios.post('/api/ai/clear-chat');
        } catch (e) { /* Ignore */ }
    };

    const quickActions = [
        { text: "🔍 Find Products", message: "What products do you have?" },
        { text: "🍳 Suggest Recipe", message: "Suggest a healthy recipe using your products" },
        { text: "📦 Track Order", message: "What's the status of my recent orders?" },
        { text: "💰 Best Deals", message: "What are the best deals right now?" },
    ];

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format markdown-like text
    const formatMessage = (text) => {
        // Bold text
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br/>');
        return formatted;
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                id="ai-chatbot-toggle"
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) setTimeout(() => inputRef.current?.focus(), 300); }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
                }}
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
                {/* Pulse animation when closed */}
                {!isOpen && (
                    <span className="absolute w-full h-full rounded-full animate-ping opacity-30"
                        style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    />
                )}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
                    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
                style={{
                    height: '520px',
                    maxHeight: 'calc(100vh - 8rem)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">GreenCart AI</h3>
                            <p className="text-white/70 text-xs">
                                {isLoading ? '⏳ Thinking...' : '🟢 Online'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearChat}
                        className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition cursor-pointer"
                        title="Clear chat"
                    >
                        Clear
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3" style={{ scrollBehavior: 'smooth' }}>
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="text-center py-4">
                            <div className="text-4xl mb-3">🌿</div>
                            <h4 className="text-gray-700 font-semibold text-sm">Welcome to GreenCart AI!</h4>
                            <p className="text-gray-400 text-xs mt-1">
                                {user ? "I can help you find products, track orders, and suggest recipes!" : "Login to get personalized help!"}
                            </p>
                        </div>
                    )}

                    {/* Quick Actions */}
                    {showQuickActions && messages.length === 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(action.message)}
                                    className="text-left px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-green-300 hover:bg-green-50 transition cursor-pointer"
                                >
                                    {action.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-green-500 text-white rounded-br-md'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
                                }`}
                            >
                                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />

                                {/* Suggested Products */}
                                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.suggestedProducts.slice(0, 3).map((product, pi) => (
                                            <div
                                                key={pi}
                                                onClick={() => {
                                                    navigate(`/products/${product.category?.toLowerCase()}/${product._id}`);
                                                    setIsOpen(false);
                                                    scrollTo(0, 0);
                                                }}
                                                className="flex items-center gap-2 p-2 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition border border-green-200"
                                            >
                                                <img src={product.image?.[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">{product.name}</p>
                                                    <p className="text-xs text-green-600 font-semibold">{currency}{product.offerPrice}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={user ? "Ask me anything..." : "Login to chat with AI"}
                            disabled={!user || isLoading}
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-green-300 transition disabled:opacity-50"
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading || !user}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                            style={{
                                background: input.trim() ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#e5e7eb',
                            }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-300 mt-1.5">Powered by GreenCart AI • Gemini</p>
                </div>
            </div>
        </>
    );
};

export default AIChatbot;
