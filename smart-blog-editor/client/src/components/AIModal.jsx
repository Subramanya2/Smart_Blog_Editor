import { useState } from 'react';
import axios from 'axios';
import { X, Sparkles, Wand2 } from 'lucide-react'; // Using lucide-react icons

export default function AIModal({ isOpen, onClose, onInsert }) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async (type) => {
        if (!text) return;
        setLoading(true);
        setResult('');
        try {
            const res = await axios.post('https://smart-blog-editor-girl.onrender.com/api/ai/generate', {
                text,
                prompt_type: type
            });
            setResult(res.data.generated_text);
        } catch (error) {
            console.error(error);
            setResult('Error generating content.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" /> AI Assistant
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <textarea
                        className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        placeholder="Paste text here to summarize or fix..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleGenerate('summary')}
                            disabled={loading || !text}
                            className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 transition flex justify-center items-center gap-2 font-medium"
                        >
                            <Sparkles className="w-4 h-4" /> Summarize
                        </button>
                        <button
                            onClick={() => handleGenerate('grammar')}
                            disabled={loading || !text}
                            className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition flex justify-center items-center gap-2 font-medium"
                        >
                            <Wand2 className="w-4 h-4" /> Fix Grammar
                        </button>
                    </div>

                    {loading && (
                        <div className="text-center py-4 text-gray-500 animate-pulse">
                            Generating magic...
                        </div>
                    )}

                    {result && (
                        <div className="bg-gray-50 p-4 rounded-lg border mt-2">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result}</p>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => { onInsert(result); onClose(); }}
                                    className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                                >
                                    Insert Result
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
