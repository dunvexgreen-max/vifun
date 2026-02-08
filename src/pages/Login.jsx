import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { dbService } from '../services/db/dbService';
import { api } from '../api';

export default function Login({ onLogin, setUser }) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const login = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			setIsLoading(true);
			setError('');
			try {
				const accessToken = tokenResponse.access_token;
				sessionStorage.setItem('gmail_access_token', accessToken);
				const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				const userInfo = await userInfoRes.json();
				const user = {
					email: userInfo.email,
					name: userInfo.name,
					picture: userInfo.picture,
					uid: userInfo.sub,
					isPro: false
				};
				await dbService.saveUserProfile(user);
				// Sync to GAS Backend to ensure user exists for getProfile
				await api.call('syncGoogleUser', { email: user.email });
				if (onLogin) onLogin(user.email);
				if (setUser) setUser(user);
			} catch (err) {
				console.error('Login Error:', err);
				setError('Đăng nhập thất bại. Vui lòng thử lại.');
			} finally {
				setIsLoading(false);
			}
		},
		onError: () => setError('Không thể kết nối với Google.'),
		scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
	});

	return (
		<div className="font-display bg-[#f8f8f5] dark:bg-[#222110] min-h-screen flex flex-col overflow-hidden text-[#1c1b0d] dark:text-[#f4f3e7] transition-colors duration-300">
			<div className="flex h-screen w-full">

				{/* --- LEFT PANEL: INTERACTION (Visible on all screens) --- */}
				<div className="flex flex-col justify-between w-full lg:w-5/12 xl:w-1/3 bg-white dark:bg-[#1a190b] p-8 md:p-12 lg:p-16 z-10 shadow-xl lg:shadow-none overflow-y-auto">

					{/* Header / Logo */}
					<div className="flex items-center gap-3">
						<div className="size-8 text-[#d4c210] dark:text-[#f4e225]">
							<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
								<path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
							</svg>
						</div>
						<h2 className="text-xl font-bold tracking-tight text-[#1c1b0d] dark:text-white">Vifun</h2>
					</div>

					{/* Main Content */}
					<div className="flex flex-col gap-8 w-full max-w-sm mx-auto my-auto h-full justify-center">
						<div className="space-y-3">
							<h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#d4c210] dark:text-[#f4e225] leading-tight uppercase">
								Sign In
							</h1>
							<p className="text-gray-600 dark:text-gray-400 text-base md:text-lg font-medium leading-relaxed">
								Securely access your market data and track your portfolio growth.
							</p>
						</div>

						{error && (
							<div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
								<p className="text-red-500 font-bold text-sm text-center">{error}</p>
							</div>
						)}

						<div className="space-y-4">
							{/* Google Login Button */}
							<button
								onClick={() => login()}
								disabled={isLoading}
								className="flex w-full items-center justify-center gap-3 bg-white dark:bg-[#2c2b1e] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#363528] text-gray-800 dark:text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group active:scale-[0.99]"
							>
								{isLoading ? (
									<div className="size-5 border-2 border-[#f4e225] border-t-transparent rounded-full animate-spin"></div>
								) : (
									<svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
										<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
										<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
										<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
									</svg>
								)}
								<span className="text-sm font-bold">Continue with Google</span>
							</button>

							{/* Divider */}
							<div className="relative flex py-2 items-center">
								<div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
								<span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-black uppercase tracking-widest">Or</span>
								<div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
							</div>

							{/* Email Input (Inactive) */}
							<div aria-hidden="true" className="space-y-3 opacity-60 pointer-events-none grayscale">
								<div>
									<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email address</label>
									<input className="w-full rounded-lg border-gray-200 bg-gray-50 dark:bg-[#222110] dark:border-gray-800 py-3 px-4 text-sm font-medium" placeholder="name@company.com" type="email" />
								</div>
								<button className="w-full bg-gray-200 dark:bg-gray-800 text-gray-500 font-bold py-3 px-4 rounded-lg text-sm">Continue with Email</button>
							</div>
						</div>
					</div>

					{/* Footer Links */}
					<div className="flex gap-6 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest pt-8">
						<a className="hover:text-[#d4c210] dark:hover:text-[#f4e225] transition-colors" href="#">Terms</a>
						<a className="hover:text-[#d4c210] dark:hover:text-[#f4e225] transition-colors" href="#">Privacy</a>
						<a className="hover:text-[#d4c210] dark:hover:text-[#f4e225] transition-colors" href="#">Help Center</a>
					</div>
				</div>

				{/* --- RIGHT PANEL: VISUAL (Desktop Only) --- */}
				<div className="hidden lg:flex w-7/12 xl:w-2/3 relative overflow-hidden bg-[#fcfbe4] dark:bg-[#1a190b] dark:bg-opacity-50 items-center justify-center p-12">
					{/* Abstract Background Shapes */}
					<div className="absolute inset-0 z-0">
						{/* Large gradient circle */}
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f4e225]/20 rounded-full blur-[100px]"></div>
						{/* Grid Pattern Overlay */}
						<div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#1c1b0d 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
					</div>

					{/* Main Illustration Container */}
					<div className="relative z-10 w-full max-w-2xl px-12 flex flex-col items-center">
						{/* Illustration */}
						<div className="relative w-full aspect-square max-h-[600px] group perspective">
							<img
								alt="Rising financial charts on a sleek modern interface"
								className="object-contain w-full h-full drop-shadow-2xl rounded-[32px] border-4 border-white/50 dark:border-white/10 transition-transform duration-700 group-hover:scale-[1.02]"
								src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdFFMuv_mkB7Jy9Vacie1cbSWFhWlCwtW79hY1czi9mFMJI2UbfWnqCb8o2wIP45zYNjT28rN-y6ARHxpEfB9HaqkJZLfIygJOkjpNGJqimHWRcTk_qlzWGPGKLxLwWPgnirRcJLmQOexQ3H95SLYtcFlv3GXl2qApb1DOhz6Bw8c2ODrmmw2d7ecIukvoCWyqq2aUZBjHkKaO-5cK0hJZsm6IomlEQNRscNX3lxF63sg3tRcosKPzhotG6qmZes6m29gyVuh2mcM"
							/>

							{/* Floating Card Elements */}
							<div className="absolute -bottom-8 -left-8 bg-white dark:bg-[#1a190b] p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
								<div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-full text-green-600 dark:text-green-400">
									<span className="material-symbols-outlined text-2xl" style={{ fontSize: '24px' }}>trending_up</span>
								</div>
								<div>
									<p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Daily Growth</p>
									<p className="text-xl font-black text-[#1c1b0d] dark:text-white">+12.4%</p>
								</div>
							</div>

							<div className="absolute top-12 -right-4 bg-[#f4e225] text-[#1c1b0d] px-5 py-3 rounded-xl shadow-xl transform rotate-3 flex items-center gap-2">
								<span className="material-symbols-outlined text-xl" style={{ fontSize: '20px' }}>verified_user</span>
								<span className="font-black text-xs uppercase tracking-wider">Secure & Fast</span>
							</div>
						</div>

						{/* Text Overlay */}
						<div className="mt-16 text-center max-w-lg">
							<h2 className="text-3xl font-black text-[#1c1b0d] dark:text-white mb-3 tracking-tight">Smart investing starts here.</h2>
							<p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Join over 10,000 users building their future with Vifun's advanced analytics tools.</p>
						</div>
					</div>
				</div>

			</div>
		</div>
	);
}
