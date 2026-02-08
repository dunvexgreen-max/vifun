import React, { useState } from 'react';
import { Sun, Moon, Monitor, Shield, Bell, User, LayoutDashboard, ArrowLeftRight, Briefcase, History as HistoryIcon, Wallet, DollarSign, Save } from 'lucide-react';

const Settings = ({ theme, setTheme, menuConfig, updateSettings }) => {
	const [localConfig, setLocalConfig] = useState(menuConfig);
	const [isSaving, setIsSaving] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const toggleMenu = (key) => {
		setLocalConfig(prev => ({ ...prev, [key]: !prev[key] }));
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateSettings(localConfig);
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (error) {
			console.error("Lỗi lưu cài đặt:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const menuOptions = [
		{ id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
		{ id: 'trade', label: 'Giao dịch', icon: ArrowLeftRight },
		{ id: 'portfolio', label: 'Danh mục', icon: Briefcase },
		{ id: 'history', label: 'Lịch sử', icon: HistoryIcon },
		{ id: 'finance', label: 'Thu chi', icon: DollarSign },
	];

	return (
		<div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in duration-500 pb-20">
			<div className="px-2 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
				<div>
					<h2 className="text-h2 uppercase">Cài đặt hệ thống</h2>
					<p className="text-body-muted text-xs uppercase tracking-widest opacity-60">Tùy chỉnh trải nghiệm của bạn</p>
				</div>
				<div className="flex flex-col items-end gap-2">
					<button
						onClick={handleSave}
						disabled={isSaving}
						className={`btn-primary !py-2.5 !px-5 ${isSaving ? 'animate-pulse' : ''}`}
					>
						<Save size={16} />
						{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
					</button>
					{showSuccess && (
						<span className="badge-success animate-in">
							✓ Đã lưu & Cập nhật!
						</span>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
				{/* Quản lý Menu */}
				<div className="card md:col-span-2 space-y-8">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/10 rounded-2xl text-primary">
							<Monitor size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-h2 !text-lg uppercase">Quản lý Menu (Hiện/Ẩn)</h3>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{menuOptions.map(opt => (
							<div key={opt.id} className="flex items-center justify-between p-4 rounded-xl bg-background-light dark:bg-background-dark/50 border border-border-light dark:border-border-dark hover:border-primary transition-all">
								<div className="flex gap-4 items-center">
									<div className="p-2 rounded-xl bg-primary/10 text-primary">
										<opt.icon size={18} />
									</div>
									<span className="text-xs font-black uppercase tracking-wider text-text-main dark:text-white">{opt.label}</span>
								</div>

								<button
									onClick={() => toggleMenu(opt.id)}
									className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${localConfig[opt.id] !== false ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-app-border'}`}
								>
									<div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${localConfig[opt.id] !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Giao diện */}
				<div className="card space-y-8">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/10 rounded-2xl text-primary">
							<Sun size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-h2 !text-lg uppercase">Giao diện</h3>
					</div>

					<div className="space-y-6">
						<div className="flex items-center justify-between p-4 rounded-xl bg-background-light dark:bg-background-dark/50 border border-border-light dark:border-border-dark">
							<div className="flex gap-4 items-center">
								<div className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
									{theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
								</div>
								<div className="flex flex-col">
									<span className="text-xs font-black uppercase tracking-wider text-text-main dark:text-white">Chế độ {theme === 'light' ? 'Sáng' : 'Tối'}</span>
									<span className="text-label">Trắng Vàng vs Đen Vàng</span>
								</div>
							</div>

							<button
								onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
								className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${theme === 'light' ? 'bg-amber-500' : 'bg-primary'}`}
							>
								<div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${theme === 'light' ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
									{theme === 'light' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-primary" />}
								</div>
							</button>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<button
								onClick={() => setTheme('light')}
								className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'bg-primary/10 border-primary text-primary' : 'bg-background-light dark:bg-background-dark/50 border-border-light dark:border-border-dark text-text-muted hover:border-primary/30'}`}
							>
								<div className="w-12 h-8 bg-white border border-yellow-200 rounded-lg flex items-center justify-center">
									<div className="w-8 h-1 bg-yellow-400 rounded-full"></div>
								</div>
								<span className="text-label">SÁNG</span>
							</button>
							<button
								onClick={() => setTheme('dark')}
								className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-primary/10 border-primary text-primary' : 'bg-background-light dark:bg-background-dark/50 border-border-light dark:border-border-dark text-text-muted hover:border-primary/30'}`}
							>
								<div className="w-12 h-8 bg-[#1c1b0d] border border-yellow-900 rounded-lg flex items-center justify-center">
									<div className="w-8 h-1 bg-yellow-500 rounded-full"></div>
								</div>
								<span className="text-label">TỐI</span>
							</button>
						</div>
					</div>
				</div>

				{/* Bảo mật */}
				<div className="card space-y-8">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
							<Shield size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-h2 !text-lg uppercase">Bảo mật</h3>
					</div>

					<div className="space-y-4">
						<button className="w-full flex items-center justify-between p-4 rounded-xl bg-background-light dark:bg-background-dark/50 border border-border-light dark:border-border-dark hover:bg-primary/5 transition-all group">
							<div className="flex flex-col text-left">
								<span className="text-xs font-black uppercase tracking-wider text-text-main dark:text-white group-hover:text-primary">Đổi mật khẩu</span>
								<span className="text-label">Cập nhật mật khẩu định kỳ</span>
							</div>
							<Shield size={16} className="text-text-muted group-hover:text-primary" />
						</button>
						<button className="w-full flex items-center justify-between p-4 rounded-xl bg-background-light dark:bg-background-dark/50 border border-border-light dark:border-border-dark hover:bg-primary/5 transition-all group">
							<div className="flex flex-col text-left">
								<span className="text-xs font-black uppercase tracking-wider text-text-main dark:text-white group-hover:text-primary">Xác thực 2 lớp</span>
								<span className="text-label">Thêm lớp bảo mật OTP</span>
							</div>
							<User size={16} className="text-text-muted group-hover:text-primary" />
						</button>
					</div>
				</div>
			</div>

			<div className="pt-4 border-t border-border-light dark:border-border-dark">
				<p className="text-[10px] text-text-muted text-center uppercase font-black tracking-[0.2em] opacity-40 leading-relaxed">
					⚠️ Vifun v2.0.5 - Phiên bản thử nghiệm.<br />Hệ thống White & Gold Premium Design.
				</p>
			</div>
		</div>
	);
};

export default Settings;
