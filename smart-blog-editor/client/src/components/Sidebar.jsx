import { Layout, Plus, FileText, LogOut, Trash2 } from 'lucide-react';

export default function Sidebar({ user, posts, activePostId, onSelectPost, onCreatePost, onDeletePost, onLogout }) {
    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2 text-purple-700">
                <Layout className="w-6 h-6" />
                <h1 className="font-bold text-xl tracking-tight">SmartBlog</h1>
            </div>

            <div className="p-4">
                <button
                    onClick={onCreatePost}
                    className="w-full bg-black text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Draft
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
                {posts.map(post => (
                    <div
                        key={post._id}
                        onClick={() => onSelectPost(post._id)}
                        className={`p-3 rounded-lg cursor-pointer transition group flex items-center gap-3 ${activePostId === post._id
                                ? 'bg-purple-50 text-purple-900'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                    >
                        <FileText className={`w-4 h-4 mt-1 ${activePostId === post._id ? 'text-purple-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{post.title || "Untitled"}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                                {new Date(post.updated_at).toLocaleDateString()}
                            </div>
                        </div>

                        <button
                            onClick={(e) => onDeletePost(post._id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-md transition-all"
                            title="Delete Post"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">@{user}</span>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 py-2 rounded transition"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );
}
