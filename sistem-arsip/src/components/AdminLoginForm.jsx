import React, { useState } from 'react';

// Simple Input component for internal use
const Input = ({ type, value, onChange, placeholder, required }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
    />
);

const AdminLoginForm = ({ onSubmit }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await onSubmit?.(email, password);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@simantep.local" required />
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
				<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi" required />
			</div>
			<button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60">
				{loading ? 'Masuk...' : 'Masuk'}
			</button>
			<p className="text-xs text-gray-500 text-center">Hanya akun admin yang diizinkan</p>
		</form>
	);
};

export default AdminLoginForm;
