import React, { useState } from 'react';

const Dashboard = ({ profile = {} }) => {
	const formatVND = (amount) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
	};

	const totalAssets = profile.totalAssets || 0;
	const balance = profile.balance || 0;
	const totalPnL = profile.totalPnL || 0;
	const totalPnLPct = profile.totalInvestment > 0 ? (totalPnL / profile.totalInvestment * 100) : 0;

	const [tradeType, setTradeType] = useState('buy');
	const [ticker, setTicker] = useState('HPG');
	const [amount, setAmount] = useState('');

	return (
		<div className="flex-1 w-full animate-in fade-in duration-500">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

				{/* --- Left Column --- */}
				<div className="lg:col-span-8 flex flex-col gap-6">

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Total Balance Card */}
						<div className="card flex flex-col justify-between">
							<div className="flex justify-between items-start mb-4">
								<div className="p-2 bg-primary/20 rounded-lg text-text-main dark:text-white dark:text-primary">
									<span className="material-symbols-outlined">account_balance_wallet</span>
								</div>
								<span className={totalPnL >= 0 ? 'badge-success' : 'badge-danger'}>
									<span className="material-symbols-outlined text-sm mr-1">{totalPnL >= 0 ? 'trending_up' : 'trending_down'}</span>
									{totalPnL >= 0 ? '+' : ''}{totalPnLPct.toFixed(1)}%
								</span>
							</div>
							<div>
								<p className="text-body-muted">Tổng tài sản</p>
								<h3 className="text-h1 mt-1">{formatVND(totalAssets)}</h3>
							</div>
						</div>

						{/* Cash Balance Card */}
						<div className="card flex flex-col justify-between">
							<div className="flex justify-between items-start mb-4">
								<div className="p-2 bg-primary/20 rounded-lg text-text-main dark:text-white dark:text-primary">
									<span className="material-symbols-outlined">credit_card</span>
								</div>
								<span className="text-label">Sẵn dụng</span>
							</div>
							<div>
								<p className="text-body-muted">Tiền mặt hiện tại</p>
								<h3 className="text-h1 mt-1">{formatVND(balance)}</h3>
								<div className="w-full bg-app-border rounded-full h-1.5 mt-4">
									<div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Chart Section */}
					<div className="card flex-1 flex flex-col min-h-[400px]">
						<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
							<div>
								<h3 className="text-text-main dark:text-white text-lg font-bold">Hiệu suất danh mục</h3>
								<p className="text-body-muted">Tăng trưởng theo thời gian</p>
							</div>
							<div className="flex bg-app-border p-1 rounded-lg">
								{['1D', '1W', '1M', '1Y', 'All'].map((t) => (
									<button
										key={t}
										className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${t === '1M' ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-text-main dark:text-white' : 'text-text-muted hover:text-text-main dark:text-white'}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>

						<div className="relative flex-1 w-full h-full min-h-[300px]">
							<svg className="w-full h-full absolute inset-0 text-primary" preserveAspectRatio="none" viewBox="0 0 100 40">
								<defs>
									<linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
										<stop offset="0%" stopColor="currentColor" stopOpacity="0.2"></stop>
										<stop offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
									</linearGradient>
								</defs>
								<path d="M0 40 L0 30 C10 28 20 35 30 25 C40 15 50 20 60 10 C70 0 80 15 90 5 L100 8 L100 40 Z" fill="url(#chartGradient)"></path>
								<path d="M0 30 C10 28 20 35 30 25 C40 15 50 20 60 10 C70 0 80 15 90 5 L100 8" fill="none" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke"></path>
							</svg>

							<div className="absolute top-[20%] left-[60%] flex flex-col items-center">
								<div className="bg-app-text dark:bg-white text-white dark:text-text-main dark:text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg mb-1">{formatVND(totalAssets)}</div>
								<div className="w-3 h-3 bg-primary rounded-full border-2 border-app-surface shadow-sm animate-pulse"></div>
								<div className="w-px h-24 bg-app-border border-dashed border-l border-accent-gold/50"></div>
							</div>

							<div className="flex justify-between mt-4 text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-70 absolute bottom-0 w-full px-2">
								<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
							</div>
						</div>
					</div>
				</div>

				{/* --- Right Column --- */}
				<div className="lg:col-span-4 flex flex-col gap-6">

					{/* Quick Trade Widget */}
					<div className="card">
						<div className="flex items-center gap-3 mb-6">
							<div className="p-2 bg-primary rounded-lg text-text-main dark:text-white">
								<span className="material-symbols-outlined">bolt</span>
							</div>
							<div>
								<h3 className="text-text-main dark:text-white text-lg font-bold">Giao dịch nhanh</h3>
								<p className="text-text-muted text-xs">Thực hiện ngay lập tức</p>
							</div>
						</div>

						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-2 p-1 bg-app-border rounded-lg">
								<button
									onClick={() => setTradeType('buy')}
									className={`py-2 text-sm font-bold rounded transition-all ${tradeType === 'buy' ? 'bg-primary text-text-main dark:text-white shadow-sm' : 'text-text-muted hover:text-text-main dark:text-white'}`}
								>Mua</button>
								<button
									onClick={() => setTradeType('sell')}
									className={`py-2 text-sm font-bold rounded transition-all ${tradeType === 'sell' ? 'bg-primary text-text-main dark:text-white shadow-sm' : 'text-text-muted hover:text-text-main dark:text-white'}`}
								>Bán</button>
							</div>

							<div className="space-y-3">
								<div className="space-y-1">
									<span className="text-label ml-1">Mã cổ phiếu</span>
									<div className="relative">
										<input
											type="text"
											value={ticker}
											onChange={(e) => setTicker(e.target.value.toUpperCase())}
											className="input-field"
											placeholder="HPG"
										/>
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-accent-gold uppercase select-none">TICKER</span>
									</div>
								</div>

								<div className="space-y-1">
									<span className="text-label ml-1">Số lượng</span>
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="input-field"
										placeholder="0"
									/>
								</div>
							</div>

							<div className="pt-2">
								<div className="flex justify-between text-xs text-text-muted mb-2">
									<span>Giá thị trường</span>
									<span className="font-bold text-text-main dark:text-white">---</span>
								</div>
								<div className="flex justify-between text-xs text-text-muted mb-4">
									<span>Ước tính phí</span>
									<span className="font-bold text-text-main dark:text-white">0 VND</span>
								</div>
								<button className="btn-dark w-full group">
									Tiếp tục
									<span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
								</button>
							</div>
						</div>
					</div>

					{/* Empty State / Watchlist */}
					<div className="card flex-1 flex flex-col">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-text-main dark:text-white text-lg font-bold">Danh mục nắm giữ</h3>
							<button className="text-primary hover:text-accent-gold">
								<span className="material-symbols-outlined">add_circle</span>
							</button>
						</div>
						<div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
							<span className="material-symbols-outlined text-4xl mb-2 text-text-muted">inventory_2</span>
							<p className="text-label">Trống</p>
						</div>
					</div>
				</div>

				{/* Recent Transactions Section */}
				<div className="lg:col-span-12">
					<div className="card">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-text-main dark:text-white text-lg font-bold">Giao dịch gần đây</h3>
							<button className="text-sm font-semibold text-primary hover:text-accent-gold">Xem tất cả</button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="border-b border-border-light dark:border-border-dark">
										<th className="pb-3 text-label">Giao dịch</th>
										<th className="pb-3 text-label">Loại</th>
										<th className="pb-3 text-label">Ngày</th>
										<th className="pb-3 text-label text-right">Số tiền</th>
									</tr>
								</thead>
								<tbody className="text-sm font-medium">
									<tr>
										<td colSpan="4" className="py-12 text-center text-text-muted text-[10px] font-bold uppercase tracking-widest opacity-50">
											Không có giao dịch mới
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
