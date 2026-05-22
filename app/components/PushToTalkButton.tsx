"use client";

import { useState, useRef } from 'react';

interface PushToTalkProps {
  teamName: string;
  colorClass: string;
  onResponse: (data: string) => void;
  socketRef: React.MutableRefObject<WebSocket | null>; // Передаем ссылку на главный сокет
}

export default function PushToTalkButton({ teamName, colorClass, onResponse, socketRef }: PushToTalkProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const activeSocket = socketRef.current;
      if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        const teamCode = teamName.includes("Команда А") ? "А" : "B";
        activeSocket.send(`TEAM_SIGNAL:ЕСТЬ_${teamCode}`);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const currentSocket = socketRef.current;
        if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
          audioBlob.arrayBuffer().then((buffer) => {
            currentSocket.send(buffer);
          });
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error("Ошибка доступа к микрофону:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className={`flex-1 p-6 ${colorClass} text-white font-black text-xl rounded-2xl uppercase tracking-wider transition-all select-none active:scale-95 shadow-lg active:shadow-inner ${
        isRecording ? 'animate-pulse ring-4 ring-white/50' : ''
      }`}
    >
      {isRecording ? '🎤 Запись идет... Отпустите для отправки' : teamName}
    </button>
  );
}