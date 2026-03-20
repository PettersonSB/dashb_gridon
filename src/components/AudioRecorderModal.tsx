import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, X, Check } from 'lucide-react';

interface AudioRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (blob: Blob) => void;
    existingAudioUrl?: string | null;
    onDelete?: () => void;
}

const MAX_DURATION = 60; // 1 minuto

export default function AudioRecorderModal({
    isOpen,
    onClose,
    onSave,
    existingAudioUrl,
    onDelete,
}: AudioRecorderModalProps) {
    const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (existingAudioUrl) {
            setAudioUrl(existingAudioUrl);
            setStatus('recorded');
        }
    }, [existingAudioUrl]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (audioUrl && !existingAudioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            setElapsedSeconds(0);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setStatus('recorded');
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start();
            setStatus('recording');

            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => {
                    if (prev >= MAX_DURATION - 1) {
                        stopRecording();
                        return MAX_DURATION;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Erro ao acessar microfone:', err);
            alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
        }
    };

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const togglePlayback = () => {
        if (!audioUrl) return;
        if (status === 'playing') {
            audioRef.current?.pause();
            setStatus('recorded');
        } else {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => setStatus('recorded');
            audio.play();
            setStatus('playing');
        }
    };

    const deleteRecording = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (audioUrl && !existingAudioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setElapsedSeconds(0);
        setStatus('idle');
        onDelete?.();
    };

    const handleSave = () => {
        if (audioBlob) {
            onSave(audioBlob);
            onClose();
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mic className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-white font-bold text-lg">Áudio Explicativo</h3>
                    <p className="text-white/40 text-sm mt-1">
                        Grave uma mensagem personalizada de até 1 minuto para o cliente.
                    </p>
                </div>

                {/* Timer / Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                        <span>{formatTime(elapsedSeconds)}</span>
                        <span>{formatTime(MAX_DURATION)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-primary'
                            }`}
                            style={{ width: `${(elapsedSeconds / MAX_DURATION) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    {status === 'idle' && (
                        <button
                            onClick={startRecording}
                            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                        >
                            <Mic className="w-7 h-7" />
                        </button>
                    )}

                    {status === 'recording' && (
                        <button
                            onClick={stopRecording}
                            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all animate-pulse"
                        >
                            <Square className="w-6 h-6" />
                        </button>
                    )}

                    {(status === 'recorded' || status === 'playing') && (
                        <>
                            <button
                                onClick={togglePlayback}
                                className="w-14 h-14 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full flex items-center justify-center text-primary transition-all"
                            >
                                {status === 'playing' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                            </button>
                            <button
                                onClick={deleteRecording}
                                className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 transition-all"
                                title="Excluir gravação"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSave}
                                className="w-12 h-12 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 transition-all"
                                title="Salvar áudio"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* Status Label */}
                <p className="text-center text-xs text-white/30 mt-4">
                    {status === 'idle' && 'Toque para iniciar a gravação'}
                    {status === 'recording' && 'Gravando... Toque para parar'}
                    {status === 'recorded' && 'Gravação pronta! Ouça ou salve.'}
                    {status === 'playing' && 'Reproduzindo...'}
                </p>
            </div>
        </div>
    );
}
