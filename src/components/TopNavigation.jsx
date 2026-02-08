import React, { useState } from 'react';

const TopNavigation = ({ activeTab, setActiveTab, onLogout, userProfile, notifications = [], onMarkRead }) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [showNotif, setShowNotif] = useState(false);
	const [showProfile, setShowProfile] = useState(false);

	const unreadCount = notifications.filter(n => !n.isRead).length;

	const handleNotifClick = () => {
		if (unreadCount > 0) onMarkRead?.();
		setShowNotif(!showNotif);
		setShowProfile(false);
	};

	const handleProfileClick = () => {
		setShowProfile(!showProfile);
		setShowNotif(false);
	};

	const menuItems = [
		{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
		{ id: 'portfolio', label: 'Ví đầu tư', icon: 'account_balance_wallet' },
		{ id: 'trade', label: 'Thị trường', icon: 'trending_up' },
		{ id: 'finance', label: 'Quản lý Thu/Chi', icon: 'payments' },
	];

	return (
		<header className="glass-header flex items-center justify-between whitespace-nowrap !z-[100]">
			<div className="flex items-center gap-10">
				{/* Logo */}
				<div
					className="flex items-center gap-4 text-black dark:text-white cursor-pointer group"
					onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
				>
					<div className="size-10 flex items-center justify-center rounded-2xl bg-primary text-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
						<span className="material-symbols-outlined text-2xl font-black">finance_mode</span>
					</div>
					<h2 className="text-2xl font-black leading-tight tracking-tighter uppercase">Vifun</h2>
				</div>

				{/* Navigation - Desktop (Visible on LG screens) */}
				<nav className="hidden lg:flex items-center gap-8">
					{menuItems.map((item) => (
						<a
							key={item.id}
							href="#"
							onClick={(e) => { e.preventDefault(); setActiveTab(item.id); }}
							className={`text-[11px] uppercase tracking-[0.2em] transition-all relative py-2 ${activeTab === item.id
								? 'text-black dark:text-white font-black'
								: 'text-text-muted font-bold hover:text-black dark:hover:text-white'
								}`}
						>
							{item.label}
							{activeTab === item.id && (
								<span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></span>
							)}
						</a>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-6">
				{/* Search Bar - Desktop */}
				<div className="hidden xl:flex items-center">
					<div className="relative group">
						<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-xl font-bold">search</span>
						<input
							className="bg-background-light dark:bg-zinc-900/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-black w-64 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold transition-all outline-none"
							placeholder="Tìm kiếm mã chứng khoán..."
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-4">
					{/* Notifications */}
					<div className="relative">
						<button
							className={`flex items-center justify-center rounded-2xl size-11 bg-background-light dark:bg-zinc-900/50 hover:bg-primary hover:text-black transition-all ${unreadCount > 0 ? 'text-primary' : 'text-text-muted dark:text-white'}`}
							onClick={handleNotifClick}
						>
							<span className="material-symbols-outlined text-[22px] font-bold">notifications</span>
							{unreadCount > 0 && (
								<span className="absolute top-2.5 right-2.5 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-black animate-bounce"></span>
							)}
						</button>

						{showNotif && (
							<div className="absolute right-0 mt-4 w-80 card !p-0 z-50 overflow-hidden animate-fade-up">
								<div className="p-5 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-white/5">
									<h3 className="text-label !mb-0">Thông báo mới</h3>
								</div>
								<div className="max-h-80 overflow-y-auto">
									{notifications.length > 0 ? notifications.map((n, i) => (
										<div key={i} className="p-4 border-b border-border-light/50 dark:border-border-dark/30 hover:bg-primary/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
											<p className="text-sm font-black text-black dark:text-white leading-snug">{n.message}</p>
											<p className="text-[10px] text-text-muted font-bold mt-2 uppercase tracking-widest">{n.date}</p>
										</div>
									)) : (
										<div className="p-10 text-center text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Không có thông báo mới</div>
									)}
								</div>
								<div className="p-4 bg-background-light/30 dark:bg-white/5 text-center">
									<button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Xem tất cả</button>
								</div>
							</div>
						)}
					</div>

					{/* Profile */}
					<div className="relative">
						<div
							className="size-11 rounded-2xl border-2 border-border-light dark:border-border-dark bg-center bg-cover shadow-xl cursor-pointer hover:scale-105 hover:border-primary transition-all overflow-hidden"
							style={{ backgroundImage: `url("${userProfile?.picture || 'https://lh3.googleusercontent.com/aida-public/...'}")` }}
							onClick={handleProfileClick}
						></div>

						{showProfile && (
							<div className="absolute right-0 mt-4 w-64 card !p-0 z-50 overflow-hidden animate-fade-up">
								<div className="p-6 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-white/5">
									<p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Tài khoản</p>
									<p className="text-sm font-black text-black dark:text-white truncate">{userProfile?.name || 'User'}</p>
									<p className="text-[10px] text-text-muted font-bold truncate mt-1">{userProfile?.email}</p>
								</div>
								<div className="p-2">
									<button
										className="w-full text-left px-5 py-3.5 text-[11px] font-black text-black dark:text-white hover:bg-primary hover:text-black rounded-xl flex items-center gap-3 transition-all uppercase tracking-widest"
										onClick={onLogout}
									>
										<span className="material-symbols-outlined text-sm">logout</span>
										Đăng xuất
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Mobile Menu Toggle (Visible below LG screen) */}
					<button
						className="flex lg:hidden items-center justify-center rounded-2xl size-11 bg-background-light dark:bg-zinc-900/50 hover:bg-primary hover:text-black transition-all"
						onClick={() => {
							setIsMobileMenuOpen(!isMobileMenuOpen);
							setShowNotif(false);
							setShowProfile(false);
						}}
					>
						<span className="material-symbols-outlined text-2xl font-bold">{isMobileMenuOpen ? 'close' : 'menu'}</span>
					</button>
				</div>
			</div>

			{/* Mobile Menu Overlay - More Robust Support */}
			{isMobileMenuOpen && (
				<div
					className="lg:hidden fixed inset-x-0 top-[88px] bottom-0 bg-white/98 dark:bg-black/98 backdrop-blur-3xl z-[90] overflow-y-auto animate-fade-up"
					style={{ height: 'calc(100vh - 88px)' }}
				>
					<nav className="p-6 flex flex-col gap-3">
						<div className="relative mb-6">
							<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-xl font-bold">search</span>
							<input
								className="w-full bg-background-light dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-xl"
								placeholder="Tìm mã cổ phiếu..."
							/>
						</div>

						{menuItems.map((item) => (
							<a
								key={item.id}
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setActiveTab(item.id);
									setIsMobileMenuOpen(false);
								}}
								className={`flex items-center gap-5 p-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === item.id
									? 'bg-primary text-black shadow-2xl ring-2 ring-primary/20'
									: 'text-text-muted bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
									}`}
							>
								<span className="material-symbols-outlined text-xl">{item.icon}</span>
								{item.label}
							</a>
						))}

						<div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
							<button
								onClick={onLogout}
								className="flex items-center gap-5 p-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-50 dark:bg-rose-950/20 w-full"
							>
								<span className="material-symbols-outlined text-xl">logout</span>
								Đăng xuất
							</button>
						</div>
					</nav>
				</div>
			)}
		</header>
	);
};

export default TopNavigation;
