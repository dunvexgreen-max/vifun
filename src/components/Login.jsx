import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

const Login = ({ onLogin }) => {
	const [isLogin, setIsLogin] = useState(true);
	const [step, setStep] = useState('input'); // 'input' or 'otp'
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [otp, setOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleStartRegister = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		const res = await api.call('sendOTP', { email });
		if (res.success) {
			setStep('otp');
		} else {
			setError(res.error || 'Cần Triển khai lại (Redeploy) GAS để cập nhật tính năng OTP.');
		}
		setLoading(false);
	};

	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		const res = await api.call('verifyOTP', { email, otp });
		if (res.success) {
			onLogin(email);
		} else {
			setError(res.error || 'Mã OTP không chính xác');
		}
		setLoading(false);
	};

	const handleLogin = (e) => {
		e.preventDefault();
		onLogin(email);
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
				<div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-success/10 rounded-full blur-[120px]"></div>
			</div>

			<div className="w-full max-w-md glass p-10 rounded-[40px] relative z-10 border-white/5 shadow-2xl">
				<div className="flex flex-col items-center mb-10">
					<div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
						<ShieldCheck size={32} className="text-white" />
					</div>
					<h1 className="text-3xl font-black tracking-tight mb-2">StockSim</h1>
					<p className="text-textSecondary font-medium text-center">
						{step === 'otp' ? 'Xác thực địa chỉ Email' : (isLogin ? 'Chào mừng bạn quay lại với hệ thống mô phỏng' : 'Bắt đầu hành trình đầu tư của bạn ngay hôm nay')}
					</p>
				</div>

				{step === 'input' ? (
					<form onSubmit={isLogin ? handleLogin : handleStartRegister} className="space-y-6">
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-widest text-textSecondary ml-1">Email</label>
							<div className="relative">
								<User className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
									placeholder="email@example.com"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-widest text-textSecondary ml-1">Mật khẩu</label>
							<div className="relative">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
								<input
									type={showPassword ? 'text' : 'password'}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 focus:border-primary outline-none transition-all placeholder:text-white/20"
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary hover:text-white transition-colors"
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						{error && <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-bold text-center">{error}</div>}

						<button
							type="submit"
							disabled={loading}
							className="w-full py-5 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
						>
							{loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN')}
							<ArrowRight size={20} />
						</button>
					</form>
				) : (
					<form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-widest text-textSecondary ml-1">Mã xác nhận (OTP)</label>
							<div className="relative">
								<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
								<input
									type="text"
									required
									maxLength={6}
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none font-mono text-xl tracking-[0.5em] text-center"
									placeholder="000000"
								/>
							</div>
							<p className="text-[10px] text-textSecondary text-center mt-2">Mã OTP đã được gửi về: <span className="text-primary">{email}</span></p>
						</div>

						{error && <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-bold text-center">{error}</div>}

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setStep('input')}
								className="flex-[0.5] py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
							>
								<ArrowLeft size={18} />
								QUAY LẠI
							</button>
							<button
								type="submit"
								disabled={loading}
								className="flex-1 py-5 rounded-2xl bg-success text-white font-bold text-lg shadow-xl shadow-success/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
							>
								{loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN'}
							</button>
						</div>

						<button
							type="button"
							onClick={handleStartRegister}
							className="w-full text-xs font-bold text-textSecondary hover:text-white transition-colors uppercase tracking-widest"
						>
							Gửi lại mã OTP
						</button>
					</form>
				)}

				{step === 'input' && (
					<div className="mt-8 text-center">
						<button
							onClick={() => setIsLogin(!isLogin)}
							className="text-sm font-medium text-textSecondary hover:text-white transition-colors"
						>
							{isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
						</button>
					</div>
				)}

				<div className="mt-10 flex items-center gap-4">
					<div className="h-px flex-1 bg-white/5"></div>
					<span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Simulation Only</span>
					<div className="h-px flex-1 bg-white/5"></div>
				</div>
			</div>
		</div>
	);
};

export default Login;
