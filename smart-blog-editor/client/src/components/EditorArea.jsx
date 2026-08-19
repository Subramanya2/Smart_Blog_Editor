import { Sparkles, FileText, Clock } from 'lucide-react';
import Editor from './Editor';
import EditorErrorBoundary from './EditorErrorBoundary';

export default function EditorArea({ activePost, onUpdateTitle, onUpdateContent, onOpenAI }) {
    if (!activePost) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <div className="w-20 h-20 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center mb-5">
                    <FileText className="w-9 h-9 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-500">No draft selected</p>
                <p className="text-sm text-gray-400 mt-1">Pick one from the sidebar or create a new draft</p>
            </div>
        );
    }

    const updatedAt = new Date(activePost.updated_at);
    const timeAgo = formatTimeAgo(updatedAt);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* ── Top bar: title + actions ── */}
            <div className="h-16 border-b border-gray-200 bg-white px-8 flex items-center gap-4 flex-shrink-0">
                <input
                    key={activePost._id}
                    type="text"
                    className="text-xl font-bold outline-none placeholder-gray-300 bg-transparent flex-1 min-w-0 text-gray-900"
                    placeholder="Untitled Draft"
                    defaultValue={activePost.title}
                    onBlur={(e) => {
                        if (e.target.value !== activePost.title) {
                            onUpdateTitle(activePost._id, e.target.value);
                        }
                    }}
                />

                <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                </div>

                <button
                    onClick={onOpenAI}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition font-medium text-sm shadow-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    AI Assistant
                </button>
            </div>

            {/* ── Editor scroll area ── */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <EditorErrorBoundary>
                        <Editor
                            key={activePost._id}
                            postId={activePost._id}
                            initialContent={activePost.content}
                            onUpdateContent={onUpdateContent}
                        />
                    </EditorErrorBoundary>

                    {/* Ghost text hint */}
                    <p className="text-xs text-gray-400 mt-3 text-center select-none">
                        ✦ Stop typing for 1.2s to see AI suggestions · Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">Tab</kbd> to accept
                    </p>
                </div>
            </div>
        </div>
    );
}

function formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
}
