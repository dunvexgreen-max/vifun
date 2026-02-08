import React, { useState, useEffect } from 'react';
import { api } from '../api';

const Dashboard = ({ profile = {}, refreshProfile }) => {
	const formatVND = (amount) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
	};

	const totalAssets = profile.totalAssets || 0;
	const balance = profile.balance || 0;
	const totalPnL = profile.totalPnL || 0;
	const totalPnLPct = profile.totalInvestment > 0 ? (totalPnL / profile.totalInvestment * 100) : 0;
	const holdings = profile.holdings || [];
	const recentHistory = profile.recentHistory || [];

	const [tradeType, setTradeType] = useState('buy');
	const [ticker, setTicker] = useState('HPG');
	const [amount, setAmount] = useState('');
	const [stockData, setStockData] = useState(null);
	const [isFetchingPrice, setIsFetchingPrice] = useState(false);
	const [isPlacingOrder, setIsPlacingOrder] = useState(false);

	// Pagination & Mode state
	const [currentPage, setCurrentPage] = useState(1);
	const [walletMode, setWalletMode] = useState('deposit'); // 'deposit' or 'adjust'
	const ITEMS_PER_PAGE = 10;

	useEffect(() => {
		let timeoutId;
		if (ticker && ticker.length >= 3) {
			timeoutId = setTimeout(async () => {
				setIsFetchingPrice(true);
				try {
					const data = await api.call('getStockData', { symbol: ticker });
					if (data && !data.error) setStockData(data);
					else setStockData(null);
				} catch (e) {
					console.error("Price fetch error:", e);
				} finally {
					setIsFetchingPrice(false);
				}
			}, 500);
		}
		return () => clearTimeout(timeoutId);
	}, [ticker]);

	const FEE_BUY = 0.0015;
	const FEE_SELL = 0.002;

	const estimatedPrice = stockData ? stockData.price : 0;
	const qty = parseInt(amount) || 0;
	const estimatedValue = estimatedPrice * qty;
	const estimatedFee = tradeType === 'buy' ? estimatedValue * FEE_BUY : estimatedValue * FEE_SELL;
	const grandTotal = tradeType === 'buy' ? estimatedValue + estimatedFee : estimatedValue - estimatedFee;

	const handlePlaceOrder = async () => {
		if (!ticker || qty <= 0 || estimatedPrice <= 0) {
			alert("Vui lòng nhập đầy đủ thông tin giao dịch hợp lệ.");
			return;
		}
		if (tradeType === 'buy' && balance < grandTotal) {
			alert("Số dư khả dụng không đủ để thực hiện lệnh này.");
			return;
		}

		setIsPlacingOrder(true);
		try {
			const res = await api.call('placeOrder', {
				email: profile.email,
				symbol: ticker,
				quantity: qty,
				type: 'MP',
				side: tradeType.toUpperCase(),
				price: estimatedPrice
			});

			if (res.success) {
				alert(`Đã thực hiện lệnh ${tradeType === 'buy' ? 'MUA' : 'BÁN'} thành công!`);
				setAmount('');
				if (refreshProfile) refreshProfile();
			} else {
				alert("Lỗi: " + (res.error || "Không thể thực hiện lệnh."));
			}
		} catch (e) {
			alert("Lỗi kết nối: " + e.message);
		} finally {
			setIsPlacingOrder(false);
		}
	};

	// Calculate pagination
	const totalPages = Math.ceil(recentHistory.length / ITEMS_PER_PAGE);
	const displayedHistory = recentHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

	return (
		<div className="flex-1 w-full animate-fade-up">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full">

				{/* --- Left Column: Assets & Performance --- */}
				<div className="lg:col-span-8 flex flex-col gap-10">

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						{/* Total Balance Card */}
						<div className="card group">
							<div className="flex justify-between items-start mb-6">
								<div className="p-3 bg-black dark:bg-white rounded-2xl text-white dark:text-black">
									<span className="material-symbols-outlined text-2xl font-black">wallet</span>
								</div>
								<span className={totalPnL >= 0 ? 'badge-success' : 'badge-danger'}>
									<span className="material-symbols-outlined text-xs">{totalPnL >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
									{totalPnL >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%
								</span>
							</div>
							<div>
								<p className="text-label mb-1">Tổng tài sản</p>
								<h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter tabular-nums break-all">{formatVND(totalAssets)}</h3>
								<p className="text-[10px] font-black text-emerald-600 mt-2 flex items-center gap-1 uppercase tracking-[0.15em]">
									Đang sinh lời: {formatVND(totalPnL)}
								</p>
							</div>
						</div>

						{/* Cash Balance Card */}
						<div className="card group">
							<div className="flex justify-between items-start mb-6">
								<div className="p-3 bg-primary rounded-2xl text-black">
									<span className="material-symbols-outlined text-2xl font-black">payments</span>
								</div>
								<div className="flex flex-col items-end">
									<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</span>
									<span className="text-[10px] font-black text-emerald-600 uppercase">Available</span>
								</div>
							</div>
							<div>
								<p className="text-label mb-1">Số dư tiền mặt</p>
								<h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter tabular-nums break-all">{formatVND(balance)}</h3>
								<div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2 mt-5 overflow-hidden">
									<div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Performance Chart */}
					<div className="card flex-1 flex flex-col min-h-[440px] sm:min-h-[480px] overflow-hidden">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-10">
							<div>
								<h3 className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Hiệu suất danh mục</h3>
								<p className="text-[10px] sm:text-xs font-semibold text-text-muted mt-1 uppercase tracking-wider">Sự thay đổi tài sản theo thời gian</p>
							</div>
							<div className="flex bg-background-light dark:bg-background-dark p-1 rounded-xl sm:rounded-2xl border border-border-light dark:border-border-dark w-full sm:w-auto overflow-x-auto no-scrollbar">
								{['1D', '1W', '1M', '1Y', 'All'].map((t) => (
									<button
										key={t}
										className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${t === '1M' ? 'bg-white dark:bg-zinc-800 shadow-xl text-black dark:text-white' : 'text-text-muted hover:text-black dark:hover:text-white'}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>

						<div className="relative flex-1 w-full bg-background-light/30 dark:bg-black/20 rounded-[1.5rem] sm:rounded-[2rem] border border-border-light/50 dark:border-border-dark/30 p-2 sm:p-4 min-h-[220px]">
							<svg className="w-full h-full absolute inset-0 text-primary/30" preserveAspectRatio="none" viewBox="0 0 100 40">
								<defs>
									<linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
										<stop offset="0%" stopColor="currentColor" stopOpacity="0.4"></stop>
										<stop offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
									</linearGradient>
								</defs>
								<path d="M0 40 L0 32 C10 30 20 38 30 28 C40 18 50 22 60 12 C70 2 80 18 90 8 L100 12 L100 40 Z" fill="url(#chartGradient)"></path>
								<path d="M0 32 C10 30 20 38 30 28 C40 18 50 22 60 12 C70 2 80 18 90 8 L100 12" fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke"></path>
							</svg>

							<div className="absolute top-[20%] right-[10%] sm:left-[60%] flex flex-col items-center">
								<div className="bg-black text-white text-[9px] sm:text-[11px] font-black px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-2xl mb-2 sm:mb-3 border border-zinc-800 whitespace-nowrap">{formatVND(totalAssets)}</div>
								<div className="w-3 h-3 sm:w-5 sm:h-5 bg-primary rounded-full border-2 sm:border-4 border-white dark:border-black shadow-2xl animate-pulse"></div>
								<div className="w-[1px] sm:w-[1.5px] h-20 sm:h-36 bg-gradient-to-b from-primary to-transparent opacity-50"></div>
							</div>

							<div className="flex justify-around sm:justify-between px-2 sm:px-10 text-[8px] sm:text-[10px] font-black text-text-muted absolute bottom-4 sm:bottom-8 w-full uppercase tracking-tighter sm:tracking-widest">
								<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
							</div>
						</div>
					</div>
				</div>

				{/* --- Right Column: Trading & Assets --- */}
				<div className="lg:col-span-4 flex flex-col gap-10">

					{/* Virtual Wallet / Quick Deposit Widget */}
					<div className="card ring-2 ring-primary/20">
						<div className="flex items-center justify-between mb-8">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-primary rounded-2xl text-black shadow-lg shadow-primary/20">
									<span className="material-symbols-outlined text-2xl font-black">{walletMode === 'deposit' ? 'savings' : 'published_with_changes'}</span>
								</div>
								<div>
									<h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">
										{walletMode === 'deposit' ? 'Nạp tiền vào ví' : 'Điều chỉnh số dư'}
									</h3>
									<p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Virtual Capital Setup</p>
								</div>
							</div>
							<button
								onClick={() => setWalletMode(walletMode === 'deposit' ? 'adjust' : 'deposit')}
								className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
							>
								{walletMode === 'deposit' ? 'Điều chỉnh' : 'Nạp tiền'}
							</button>
						</div>

						{/* Available Balance Card Visual */}
						<div className="relative overflow-hidden p-6 rounded-[1.5rem] bg-gradient-to-br from-zinc-900 to-black text-white mb-8 border border-zinc-800 shadow-2xl group">
							<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
								<span className="material-symbols-outlined text-8xl">account_balance_wallet</span>
							</div>
							<p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Số dư khả dụng</p>
							<h4 className="text-3xl font-black tracking-tighter text-primary tabular-nums mb-6">{formatVND(balance)}</h4>
							<div className="flex justify-between items-end">
								<p className="text-[10px] font-bold text-white/30 truncate max-w-[150px]">{profile.email || 'DEMO_ACCOUNT'}</p>
								<span className="text-[10px] font-black tracking-widest text-primary/50">VIRTUAL CARD</span>
							</div>
						</div>

						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex justify-between px-1">
									<span className="text-label !mb-0">
										{walletMode === 'deposit' ? 'Số tiền muốn nạp (VND)' : 'Thiết lập số dư mới (VND)'}
									</span>
								</div>
								<div className="relative">
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="input-field !text-2xl !py-6 text-center tabular-nums"
										placeholder="0"
									/>
									<span className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted font-black text-xs">VND</span>
								</div>
							</div>

							{/* Quick Amount Selection */}
							<div className="grid grid-cols-2 gap-3">
								{[
									{ label: '+10 Triệu', value: 10000000 },
									{ label: '+50 Triệu', value: 50000000 },
									{ label: '+1 Trăm Tr', value: 100000000 },
									{ label: '+5 Trăm Tr', value: 500000000 },
								].map((btn) => (
									<button
										key={btn.value}
										onClick={() => setAmount(btn.value)}
										className="py-4 bg-background-light dark:bg-white/5 border border-border-light dark:border-border-dark rounded-2xl text-[11px] font-black hover:bg-primary hover:text-black transition-all active:scale-95"
									>
										{btn.label}
									</button>
								))}
							</div>

							<div className="pt-6 border-t border-dashed border-border-light dark:border-border-dark">
								<button
									onClick={async () => {
										const val = parseFloat(amount);
										if (!val || val < 0) {
											alert("Vui lòng nhập số tiền hợp lệ");
											return;
										}
										setIsPlacingOrder(true);
										try {
											const action = walletMode === 'deposit' ? 'depositFunds' : 'adjustBalance';
											const res = await api.call(action, {
												email: profile.email,
												amount: val
											});
											if (res.success) {
												alert(`${walletMode === 'deposit' ? 'Đã nạp thành công' : 'Đã điều chỉnh số dư thành'} ${formatVND(val)}!`);
												setAmount('');
												if (refreshProfile) refreshProfile();
											} else {
												alert("Lỗi: " + (res.error || "Thao tác không thành công."));
											}
										} catch (e) {
											alert("Lỗi kết nối: " + e.message);
										} finally {
											setIsPlacingOrder(false);
										}
									}}
									disabled={isPlacingOrder}
									className={`btn-primary w-full !py-5 uppercase tracking-[0.2em] text-xs font-black shadow-2xl ${isPlacingOrder ? 'opacity-50' : ''}`}
								>
									{isPlacingOrder ? 'Đang xử lý...' : walletMode === 'deposit' ? 'Xác nhận nạp vốn' : 'Xác nhận điều chỉnh'}
								</button>
								<p className="text-[9px] text-center text-text-muted font-bold mt-4 uppercase tracking-tighter opacity-50">
									⚠️ Đây là tiền ảo mô phỏng. Giao dịch không có giá trị quy đổi thực tế.
								</p>
							</div>
						</div>
					</div>

					{/* Portfolio Preview */}
					<div className="card flex-1 flex flex-col min-h-[300px]">
						<div className="flex justify-between items-center mb-8">
							<h3 className="text-h2 uppercase tracking-tighter">Danh mục</h3>
							<span className="px-4 py-1.5 bg-black text-white text-[10px] font-black rounded-full uppercase tracking-widest">{holdings.length} Mã</span>
						</div>

						<div className="flex-1 space-y-4 custom-scrollbar">
							{holdings.length > 0 ? holdings.map((h, i) => (
								<div key={i} className="group flex items-center justify-between p-5 bg-background-light dark:bg-background-dark/40 rounded-2xl border-2 border-transparent hover:border-black dark:hover:border-white transition-all cursor-pointer">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center font-black text-sm shadow-xl border border-border-light dark:border-border-dark group-hover:bg-primary group-hover:text-black transition-colors">
											{h.symbol}
										</div>
										<div>
											<p className="text-sm font-black text-black dark:text-white">{h.quantity.toLocaleString()}</p>
											<p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-0.5">Giá vốn: {formatVND(h.avgPrice)}</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm font-black text-black dark:text-white">{formatVND(h.value || (h.quantity * h.avgPrice))}</p>
										<p className={`text-[10px] font-black mt-1 py-1 px-2 rounded-lg inline-block ${(h.pnlPct || 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
											{(h.pnlPct || 0) >= 0 ? '▲' : '▼'} {Math.abs(h.pnlPct || 0).toFixed(2)}%
										</p>
									</div>
								</div>
							)) : (
								<div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
									<span className="material-symbols-outlined text-6xl mb-4">inventory</span>
									<p className="text-xs font-black uppercase tracking-widest">Trống</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* History Table */}
				<div className="lg:col-span-12">
					<div className="card">
						<div className="flex justify-between items-center mb-10">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-black dark:bg-white rounded-2xl text-white dark:text-black">
									<span className="material-symbols-outlined text-2xl font-black">history_edu</span>
								</div>
								<div>
									<h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Lịch sử giao dịch</h3>
									<p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Latest Transactions</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								{/* Pagination UI */}
								<div className="flex items-center bg-background-light dark:bg-zinc-900 rounded-xl p-1 border border-border-light dark:border-border-dark">
									<button
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="p-2 hover:text-primary disabled:opacity-30 transition-colors"
									>
										<span className="material-symbols-outlined font-black">chevron_left</span>
									</button>
									<span className="px-4 text-[10px] font-black uppercase tracking-widest">
										Trang {currentPage} / {totalPages || 1}
									</span>
									<button
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages || totalPages === 0}
										className="p-2 hover:text-primary disabled:opacity-30 transition-colors"
									>
										<span className="material-symbols-outlined font-black">chevron_right</span>
									</button>
								</div>
								<button
									className="hidden sm:block text-[11px] font-black text-black dark:text-white hover:text-primary underline underline-offset-8 decoration-2 decoration-primary/50 transition-all uppercase tracking-[0.2em]"
								>
									Khám phá thêm
								</button>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b-2 border-black dark:border-white">
										<th className="pb-6 text-label">Thời gian</th>
										<th className="pb-6 text-label">Mã CP</th>
										<th className="pb-6 text-label">Phân loại</th>
										<th className="pb-6 text-label">S.Lượng</th>
										<th className="pb-6 text-label">Giá khớp</th>
										<th className="pb-6 text-label text-right">Tổng giá trị</th>
										<th className="pb-6 text-label text-right">% Lãi/Lỗ</th>
										<th className="pb-6 text-label text-right">Hành động</th>
									</tr>
								</thead>
								<tbody className="text-sm">
									{displayedHistory.length > 0 ? displayedHistory.map((t, i) => {
										// Calculate PnL % for display based on 'pnl' property from backend
										const realizedPnL = t.pnl || 0;
										const pnlPct = realizedPnL && t.total ? (realizedPnL / (t.total - realizedPnL) * 100) : 0;
										const transDate = new Date(t.date);
										const transId = t.id || (transDate instanceof Date ? transDate.getTime() : t.date);

										return (
											<tr key={i} className="group border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-white/5 transition-all">
												<td className="py-7">
													<p className="font-black text-black dark:text-white">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
													<p className="text-[10px] font-bold text-text-muted uppercase mt-0.5">{new Date(t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
												</td>
												<td className="py-7">
													<span className="px-4 py-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl font-black text-xs group-hover:bg-primary group-hover:text-black transition-colors">
														{t.symbol}
													</span>
												</td>
												<td className="py-7">
													<span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.side === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
														{t.side === 'BUY' ? 'MUA' : 'BÁN'}
													</span>
												</td>
												<td className="py-7 font-black text-black dark:text-white tabular-nums">{t.quantity.toLocaleString()}</td>
												<td className="py-7 font-black text-black dark:text-white tabular-nums">{formatVND(t.price)}</td>
												<td className="py-7 text-right font-black text-black dark:text-white tabular-nums">{formatVND(t.total)}</td>
												<td className="py-7 text-right tabular-nums">
													{t.side === 'SELL' && (realizedPnL !== 0) ? (
														<div className="flex flex-col items-end">
															<span className={`font-black text-sm ${realizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
																{realizedPnL >= 0 ? '+' : ''}{formatVND(realizedPnL)}
															</span>
															<span className={`text-[10px] font-black px-2 py-0.5 rounded-md mt-1 ${realizedPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
																{realizedPnL >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
															</span>
														</div>
													) : (
														<span className="text-text-muted opacity-20 font-black">-</span>
													)}
												</td>
												<td className="py-7 text-right">
													<button
														onClick={async () => {
															if (window.confirm(`Bạn có chắc muốn xóa giao dịch ${t.symbol} này? Hành động này sẽ hoàn trả số dư và cổ phiếu tương ứng.`)) {
																try {
																	const res = await api.call('deleteTransaction', {
																		email: profile.email,
																		transId: transId
																	});
																	if (res.success) {
																		if (refreshProfile) refreshProfile();
																	} else {
																		alert("Lỗi xóa: " + res.error);
																	}
																} catch (e) {
																	alert("Lỗi: " + e.message);
																}
															}
														}}
														className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
														title="Xóa giao dịch"
													>
														<span className="material-symbols-outlined text-sm font-black">delete</span>
													</button>
												</td>
											</tr>
										);
									}) : (
										<tr>
											<td colSpan="8" className="py-32 text-center">
												<div className="flex flex-col items-center opacity-20">
													<span className="material-symbols-outlined text-7xl mb-4">query_stats</span>
													<p className="text-xs font-black uppercase tracking-[0.2em]">Dữ liệu trống</p>
												</div>
											</td>
										</tr>
									)}
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
