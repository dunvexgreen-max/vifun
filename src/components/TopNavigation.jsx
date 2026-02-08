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
		{ id: 'portfolio', label: 'Wallet', icon: 'account_balance_wallet' },
		{ id: 'trade', label: 'Markets', icon: 'trending_up' },
	];

	return (
		<header className="glass-header flex items-center justify-between whitespace-nowrap">
			<div className="flex items-center gap-8">
				{/* Logo */}
				<div
					className="flex items-center gap-3 text-text-main dark:text-white cursor-pointer"
					onClick={() => setActiveTab('dashboard')}
				>
					<div className="size-8 flex items-center justify-center rounded-lg bg-primary text-text-main dark:text-white">
						<span className="material-symbols-outlined text-2xl font-bold">finance_mode</span>
					</div>
					<h2 className="text-xl font-bold leading-tight tracking-tight">Vifun</h2>
				</div>

				{/* Search Bar */}
				<div className="hidden lg:flex items-center">
					<label className="flex flex-col min-w-40 !h-10 max-w-64">
						<div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-transparent focus-within:border-primary transition-all bg-app-border">
							<div className="text-accent-gold flex items-center justify-center pl-3">
								<span className="material-symbols-outlined text-[20px]">search</span>
							</div>
							<input
								className="flex w-full min-w-0 flex-1 bg-transparent text-text-main dark:text-white focus:outline-none border-none h-full placeholder:text-text-muted/50 px-3 text-sm font-normal"
								placeholder="Search markets..."
							/>
						</div>
					</label>
				</div>
			</div>

			<div className="flex flex-1 justify-end gap-6 md:gap-8 items-center">
				{/* Navigation */}
				<nav className="hidden md:flex items-center gap-6">
					{menuItems.map((item) => (
						<a
							key={item.id}
							href="#"
							onClick={(e) => { e.preventDefault(); setActiveTab(item.id); }}
							className={`text-sm tracking-tight transition-colors ${activeTab === item.id
								? 'text-text-main dark:text-white font-bold'
								: 'text-text-muted font-medium hover:text-text-main dark:text-white'
								}`}
						>
							{item.label}
						</a>
					))}
				</nav>

				{/* Actions */}
				<div className="flex items-center gap-3">
					{/* Notifications */}
					<div className="relative">
						<button
							className={`flex items-center justify-center rounded-full size-10 hover:bg-app-border transition-colors ${unreadCount > 0 ? 'text-primary' : 'text-text-main dark:text-white'}`}
							onClick={handleNotifClick}
						>
							<span className="material-symbols-outlined text-[24px]">notifications</span>
							{unreadCount > 0 && <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-app-bg"></span>}
						</button>

						{showNotif && (
							<div className="absolute right-0 mt-2 w-80 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl z-50 overflow-hidden">
								<div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50">
									<h3 className="text-label">Notifications</h3>
								</div>
								<div className="max-h-64 overflow-y-auto">
									{notifications.length > 0 ? notifications.map((n, i) => (
										<div key={i} className="p-3 border-b border-border-light dark:border-border-dark hover:bg-background-light dark:bg-background-dark/50 transition-colors">
											<p className="text-xs font-semibold text-text-main dark:text-white">{n.message}</p>
											<p className="text-[10px] text-text-muted mt-1">{n.date}</p>
										</div>
									)) : (
										<div className="p-8 text-center text-text-muted text-xs font-medium">No notifications</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Profile */}
					<div className="relative">
						<div
							className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-border-light dark:border-border-dark shadow-sm cursor-pointer hover:scale-105 transition-transform"
							style={{ backgroundImage: `url("${userProfile?.picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuATOtckd_NVqymcRQkWkywbJ17axaXH229LCk9Rg0xSR0Em8PO0OK7E53pCXuPOaei9DFVk_YIbZ9j2bBymix4MX4UT8LmAcTc2YuhdiUd3ptOIuIcZeREODUyZ7VA-wb9-UY1pa39AVSyHtZQzpOmTIYbJZme8SNNmVEEJKJgdDaKgNqEGJOZiG28z5Ds4MDxswI_ojMykvCcZgVe8zBA64mtCu_NKFUjIcbTPxsM0LefI7Vz3bX8qiwznvzSGNUQ6pvoFGS6jsk'}")` }}
							onClick={handleProfileClick}
						></div>

						{showProfile && (
							<div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl z-50 p-2">
								<div className="p-3 border-b border-border-light dark:border-border-dark mb-2">
									<p className="text-sm font-bold text-text-main dark:text-white truncate">{userProfile?.name || 'User'}</p>
									<p className="text-[10px] text-text-muted truncate">{userProfile?.email}</p>
								</div>
								<button
									className="w-full text-left px-3 py-2 text-sm font-medium text-text-main dark:text-white hover:bg-background-light dark:bg-background-dark rounded-lg flex items-center gap-2 transition-colors"
									onClick={onLogout}
								>
									<span className="material-symbols-outlined text-sm">logout</span>
									Sign Out
								</button>
							</div>
						)}
					</div>

					{/* Mobile Menu Toggle */}
					<button
						className="flex items-center justify-center rounded-full size-10 hover:bg-app-border text-text-main dark:text-white transition-colors md:hidden"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					>
						<span className="material-symbols-outlined text-[24px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
					</button>
				</div>
			</div>

			{/* Mobile Menu */}
			{isMobileMenuOpen && (
				<div className="md:hidden fixed inset-x-0 top-[73px] bg-background-light dark:bg-background-dark/98 backdrop-blur-md border-b border-border-light dark:border-border-dark shadow-xl z-40">
					<nav className="p-4 flex flex-col gap-2">
						{menuItems.map((item) => (
							<a
								key={item.id}
								href="#"
								onClick={(e) => { e.preventDefault(); setActiveTab(item.id); setIsMobileMenuOpen(false); }}
								className={`flex items-center gap-4 p-4 rounded-xl text-sm transition-all ${activeTab === item.id
									? 'bg-primary text-text-main dark:text-white font-bold shadow-md'
									: 'text-text-muted font-medium hover:bg-app-border'
									}`}
							>
								<span className="material-symbols-outlined">{item.icon}</span>
								{item.label}
							</a>
						))}
						<button
							onClick={onLogout}
							className="flex items-center gap-4 p-4 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all text-left"
						>
							<span className="material-symbols-outlined">logout</span>
							Sign Out
						</button>
					</nav>
				</div>
			)}
		</header>
	);
};

export default TopNavigation;
