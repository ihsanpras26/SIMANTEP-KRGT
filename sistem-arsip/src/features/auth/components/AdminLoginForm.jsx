import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { LogIn } from 'lucide-react';

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
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label htmlFor="login-email" className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
				<input
					id="login-email"
					autoComplete="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="admin@simantep.local"
					required
					className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-base sm:text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 outline-none"
				/>
			</div>
			<div>
				<label htmlFor="login-password" className="block text-sm font-medium text-neutral-700 mb-2">Kata sandi</label>
				<input
					id="login-password"
					autoComplete="current-password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Kata sandi"
					required
					className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-base sm:text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-200 outline-none"
				/>
			</div>
			<Button
				type="submit"
				size="lg"
				loading={loading}
				className="w-full"
			>
				<LogIn size={18} />
				{loading ? 'Masuk...' : 'Masuk'}
			</Button>
			<p className="text-xs text-neutral-500 text-center">Hanya akun admin yang diizinkan</p>
		</form>
	);
};

export default AdminLoginForm;

