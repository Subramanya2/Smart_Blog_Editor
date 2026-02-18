import { Sparkles, FileText } from 'lucide-react';
import Editor from './Editor';

export default function EditorArea({ activePost, onUpdateTitle, onOpenAI }) {
    if (!activePost) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-lg">Select a post or create a new draft</p>
            </div>
        );
    }

    return (
        <>
            {/* Header / Toolbar */}
            <div className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between">
                <input
                    key={activePost._id}
                    type="text"
                    className="text-lg font-bold outline-none placeholder-gray-400 bg-transparent flex-1"
                    placeholder="Post Title..."
                    defaultValue={activePost.title}
                    onBlur={(e) => {
                        if (e.target.value !== activePost.title) {
                            onUpdateTitle(activePost._id, e.target.value);
                        }
                    }}
                />

                <button
                    onClick={onOpenAI}
                    className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-md transition font-medium text-sm"
                >
                    <Sparkles className="w-4 h-4" /> AI Assistant
                </button>
            </div>

            {/* Editor Wrapper */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                <div className="max-w-3xl mx-auto">
                    <Editor
                        key={activePost._id}
                        postId={activePost._id}
                        initialContent={activePost.content}
                    />
                </div>
            </div>
        </>
    );
}
