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
		{ id: 'wallet', label: 'Ví tiền', icon: Wallet },
		{ id: 'finance', label: 'Thu chi', icon: DollarSign },
	];

	return (
		<div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in side-in-from-right-5 duration-500 pb-20">
			<div className="px-2 flex justify-between items-end">
				<div>
					<h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight">Cài đặt hệ thống</h2>
					<p className="text-textSecondary font-bold text-xs lg:text-sm mt-1 uppercase tracking-widest opacity-60">Tùy chỉnh trải nghiệm của bạn</p>
				</div>
				<div className="flex flex-col items-end gap-2">
					<button
						onClick={handleSave}
						disabled={isSaving}
						className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${isSaving ? 'bg-primary/20 text-primary animate-pulse' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primaryHover'}`}
					>
						<Save size={16} />
						{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
					</button>
					{showSuccess && (
						<span className="text-success text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
							✓ Đã lưu & Cập nhật danh sách menu!
						</span>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
				{/* Quản lý Menu */}
				<div className="glass p-6 lg:p-8 rounded-[40px] border-faint space-y-8 overflow-hidden relative group md:col-span-2">
					<div className="absolute -right-10 -top-10 w-40 h-40 bg-success/10 rounded-full blur-3xl group-hover:bg-success/20 transition-all duration-700"></div>

					<div className="relative z-10 flex items-center gap-4">
						<div className="p-3 bg-success/10 rounded-2xl text-success">
							<Monitor size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-lg font-black tracking-tight uppercase">Quản lý Menu (Hiện/Ẩn)</h3>
					</div>

					<div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{menuOptions.map(opt => (
							<div key={opt.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint hover:border-primary/30 transition-all">
								<div className="flex gap-4 items-center">
									<div className={`p-2 rounded-xl bg-primary/10 text-primary`}>
										<opt.icon size={18} />
									</div>
									<span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
								</div>

								<button
									onClick={() => toggleMenu(opt.id)}
									className={`w-12 h-7 rounded-full transition-all relative flex items-center px-1 ${localConfig[opt.id] !== false ? 'bg-success shadow-lg shadow-success/20' : 'bg-textSecondary/20'}`}
								>
									<div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${localConfig[opt.id] !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Giao diện */}
				<div className="glass p-6 lg:p-8 rounded-[40px] border-faint space-y-8 overflow-hidden relative group">
					<div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>

					<div className="relative z-10 flex items-center gap-4">
						<div className="p-3 bg-primary/10 rounded-2xl text-primary">
							<Monitor size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-lg font-black tracking-tight uppercase">Giao diện</h3>
					</div>

					<div className="relative z-10 space-y-6">
						<div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint">
							<div className="flex gap-4 items-center">
								<div className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-primary'}`}>
									{theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
								</div>
								<div className="flex flex-col">
									<span className="text-xs font-black uppercase tracking-wider">Chế độ {theme === 'light' ? 'Sáng' : 'Tối'}</span>
									<span className="text-[10px] text-textSecondary font-bold">Thay đổi màu sắc chủ đạo</span>
								</div>
							</div>

							<button
								onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
								className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${theme === 'light' ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-primary shadow-lg shadow-primary/20'}`}
							>
								<div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${theme === 'light' ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
									{theme === 'light' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-primary" />}
								</div>
							</button>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<button
								onClick={() => setTheme('light')}
								className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-faint text-textSecondary hover:border-primary/30'}`}
							>
								<div className="w-12 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
									<div className="w-8 h-1 bg-gray-200 rounded-full"></div>
								</div>
								<span className="text-[10px] font-black uppercase tracking-widest">Sáng</span>
							</button>
							<button
								onClick={() => setTheme('dark')}
								className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-faint text-textSecondary hover:border-primary/30'}`}
							>
								<div className="w-12 h-8 bg-[#0B1424] border border-faint rounded-lg flex items-center justify-center">
									<div className="w-8 h-1 bg-muted rounded-full"></div>
								</div>
								<span className="text-[10px] font-black uppercase tracking-widest">Tối</span>
							</button>
						</div>
					</div>
				</div>

				{/* Thông báo */}
				<div className="glass p-6 lg:p-8 rounded-[40px] border-faint space-y-8 overflow-hidden relative group">
					<div className="relative z-10 flex items-center gap-4">
						<div className="p-3 bg-success/10 rounded-2xl text-success">
							<Bell size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-lg font-black tracking-tight uppercase">Thông báo</h3>
					</div>

					<div className="relative z-10 space-y-4">
						<div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint">
							<div className="flex flex-col">
								<span className="text-xs font-black uppercase tracking-wider">Thông báo đẩy</span>
								<span className="text-[10px] text-textSecondary font-bold">Nhận thông báo khi khớp lệnh</span>
							</div>
							<div className="w-10 h-6 bg-success rounded-full flex items-center px-1 justify-end">
								<div className="w-4 h-4 bg-white rounded-full"></div>
							</div>
						</div>
						<div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint">
							<div className="flex flex-col">
								<span className="text-xs font-black uppercase tracking-wider">Âm thanh</span>
								<span className="text-[10px] text-textSecondary font-bold">Phát âm thanh khi có biến động</span>
							</div>
							<div className="w-10 h-6 bg-muted rounded-full flex items-center px-1">
								<div className="w-4 h-4 bg-white/40 rounded-full"></div>
							</div>
						</div>
					</div>
				</div>

				{/* Bảo mật */}
				<div className="glass p-6 lg:p-8 rounded-[40px] border-faint space-y-8 overflow-hidden relative group">
					<div className="relative z-10 flex items-center gap-4">
						<div className="p-3 bg-danger/10 rounded-2xl text-danger">
							<Shield size={24} strokeWidth={2.5} />
						</div>
						<h3 className="text-lg font-black tracking-tight uppercase">Bảo mật</h3>
					</div>

					<div className="relative z-10 space-y-4">
						<button className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint hover:bg-white/[0.04] transition-all group">
							<div className="flex flex-col text-left">
								<span className="text-xs font-black uppercase tracking-wider group-hover:text-white">Đổi mật khẩu</span>
								<span className="text-[10px] text-textSecondary font-bold">Cập nhật mật khẩu định kỳ</span>
							</div>
							<div className="text-textSecondary group-hover:text-white">
								<Shield size={16} />
							</div>
						</button>
						<button className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted border border-faint hover:bg-white/[0.04] transition-all group">
							<div className="flex flex-col text-left">
								<span className="text-xs font-black uppercase tracking-wider group-hover:text-white">Xác thực 2 lớp</span>
								<span className="text-[10px] text-textSecondary font-bold">Thêm lớp bảo mật OTP</span>
							</div>
							<div className="text-textSecondary group-hover:text-white">
								<User size={16} />
							</div>
						</button>
					</div>
				</div>
			</div>

			<div className="pt-4 border-t border-faint">
				<p className="text-[9px] text-textSecondary text-center uppercase font-black tracking-[0.2em] opacity-40 leading-relaxed">
					⚠️ StockSim v2.0.4 - Phiên bản thử nghiệm.<br />Một số cài đặt nâng cao sẽ được cập nhật sớm.
				</p>
			</div>
		</div>
	);
};

export default Settings;
