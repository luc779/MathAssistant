"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send } from "lucide-react";

interface Message {
    text: string;
    isUser: boolean;
}

export default function Component() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [recognition, setRecognition] = useState<any>(null);
    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null); 

    const getSpeech = () => {
        if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
            const speechRecognition = new (window as any).webkitSpeechRecognition();

            speechRecognition.continuous = true;
            speechRecognition.interimResults = true;

            speechRecognition.onresult = (event: { results: { transcript: any }[][] }) => {
                const speechTranscript = event.results[0][0].transcript;
                if (!inputText.trim()) {
                    setInputText(speechTranscript);
                } else {
                    setInputText((prev) => prev + " " + speechTranscript);
                }
                adjustTextareaHeight();
                console.log("Transcript:", speechTranscript);
            };

            speechRecognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
            };

            speechRecognition.onend = () => {
                console.log("Speech recognition ended.");
            };

            speechRecognition.start();
            setRecognition(speechRecognition);
            console.log("Speech recognition started.");
        } else {
            console.error("Speech recognition is not supported in this browser.");
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputText]);

    const toggleListening = () => {
        if (recognition) {
            recognition.stop();
            setRecognition(null);
        } else {
            getSpeech();
        }
    };

    const sendMessage = () => {
        if (inputText.trim() && !isAwaitingResponse) { 
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: inputText, isUser: true },
            ]);
            setInputText("");
            adjustTextareaHeight();
            setIsAwaitingResponse(true);

            scrollToBottom();

            // response from AI, just same text said back for now
            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: `You said: ${inputText}`, isUser: false },
                ]);
                scrollToBottom();
                setIsAwaitingResponse(false); 
            }, 1000);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
    };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    return (
        <div className="flex flex-col h-screen w-[700px] mx-auto p-4">
            <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-4"
            >
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`rounded-lg p-2 max-w-[70%] ${
                                message.isUser ? "bg-blue-500 text-white" : "bg-gray-600"
                            }`}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 p-2 rounded border-primary resize-none overflow-hidden min-h-[40px] max-h-[200px]"
                    rows={1}
                    disabled={isAwaitingResponse} // disable textarea when waiting response
                />
                <Button onClick={sendMessage} disabled={isAwaitingResponse}> 
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                </Button>
                <Button
                    onClick={toggleListening}
                    variant={recognition ? "destructive" : "default"}
                >
                    {recognition ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span className="sr-only">
                        {recognition ? "Stop listening" : "Start listening"}
                    </span>
                </Button>
            </div>
        </div>
    );
}
