import { useState } from 'react';
import api from '../services/api';
import { X, Sparkles, Wand2, FileText, Check, Copy, ArrowDownToLine } from 'lucide-react';

export default function AIModal({ isOpen, onClose, onInsert }) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async (type) => {
        if (!text.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await api.post('/api/ai/generate', {
                text,
                prompt_type: type
            });
            setResult(res.data.generated_text);
        } catch (error) {
            console.error(error);
            setResult('Error generating content. Please check server logs or API quota.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-white">AI Writing Assistant</h3>
                            <p className="text-[11px] text-slate-400">Summarize, rewrite, or polish your content</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Input Context</label>
                        <textarea
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 h-28 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none resize-none text-sm text-slate-200 placeholder-slate-500 transition leading-relaxed font-sans"
                            placeholder="Paste or write notes, paragraphs, or thoughts here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleGenerate('summary')}
                            disabled={loading || !text.trim()}
                            className="bg-purple-950/80 border border-purple-800/60 hover:bg-purple-900/60 text-purple-300 py-2.5 px-4 rounded-xl transition flex justify-center items-center gap-2 text-xs font-semibold disabled:opacity-40 active:scale-[0.99]"
                        >
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span>Summarize in 2 Sentences</span>
                        </button>
                        <button
                            onClick={() => handleGenerate('grammar')}
                            disabled={loading || !text.trim()}
                            className="bg-indigo-950/80 border border-indigo-800/60 hover:bg-indigo-900/60 text-indigo-300 py-2.5 px-4 rounded-xl transition flex justify-center items-center gap-2 text-xs font-semibold disabled:opacity-40 active:scale-[0.99]"
                        >
                            <Wand2 className="w-4 h-4 text-indigo-400" />
                            <span>Fix Grammar & Style</span>
                        </button>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                            <span className="text-xs text-purple-300 font-medium">Generating smart completion via Groq AI...</span>
                        </div>
                    )}

                    {/* Result card */}
                    {result && !loading && (
                        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mt-3">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                                <span className="text-[11px] font-mono text-purple-400 font-medium uppercase tracking-wider">AI Generated Result</span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 flex items-center gap-1 transition"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        <span>{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onInsert(result);
                                            onClose();
                                        }}
                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium px-2.5 py-1 rounded-md flex items-center gap-1 transition shadow-sm"
                                    >
                                        <ArrowDownToLine className="w-3 h-3" />
                                        <span>Copy & Insert</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                {result}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
