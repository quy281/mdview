import { useState } from 'react'
import pb from '../store/pb'

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Authenticate as Admin (per user request for db.mkg.vn)
            // PB will automatically save the token to localStorage via pb.authStore
            await pb.admins.authWithPassword(email, password)
            onLoginSuccess()
        } catch (err) {
            console.error('Login error:', err)
            setError('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4" style={{ fontFamily: 'var(--font-sans)' }}>
            <div className="w-full max-w-md bg-white p-8 border border-gray-300 shadow-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 cursor-default" style={{ fontFamily: 'var(--font-doc)' }}>HoSo Reader</h1>
                    <p className="text-gray-500 text-sm">Đăng nhập để đồng bộ dự án</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 focus:border-ink outline-none transition-colors"
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 focus:border-ink outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-ink text-paper font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    )
}
