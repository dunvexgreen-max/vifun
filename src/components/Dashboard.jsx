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
					<div className="card flex-1 flex flex-col min-h-[480px]">
						<div className="flex flex-wrap items-center justify-between gap-6 mb-10">
							<div>
								<h3 className="text-h2">Hiệu suất danh mục</h3>
								<p className="text-sm font-semibold text-text-muted mt-1">Sự thay đổi tài sản theo thời gian</p>
							</div>
							<div className="flex bg-background-light dark:bg-background-dark p-1.5 rounded-2xl border border-border-light dark:border-border-dark">
								{['1D', '1W', '1M', '1Y', 'All'].map((t) => (
									<button
										key={t}
										className={`px-5 py-2.5 text-[10px] font-black rounded-xl transition-all ${t === '1M' ? 'bg-white dark:bg-zinc-800 shadow-xl text-black dark:text-white' : 'text-text-muted hover:text-black dark:hover:text-white'}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>

						<div className="relative flex-1 w-full bg-background-light/30 dark:bg-black/20 rounded-[2rem] border border-border-light/50 dark:border-border-dark/30 p-4">
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

							<div className="absolute top-[20%] left-[60%] flex flex-col items-center">
								<div className="bg-black text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-2xl mb-3 border border-zinc-800">{formatVND(totalAssets)}</div>
								<div className="w-5 h-5 bg-primary rounded-full border-4 border-white dark:border-black shadow-2xl animate-pulse"></div>
								<div className="w-[1.5px] h-36 bg-gradient-to-b from-primary to-transparent opacity-50"></div>
							</div>

							<div className="flex justify-between mt-6 text-[10px] font-black text-text-muted absolute bottom-8 w-full px-10 uppercase tracking-widest">
								<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
							</div>
						</div>
					</div>
				</div>

				{/* --- Right Column: Trading & Assets --- */}
				<div className="lg:col-span-4 flex flex-col gap-10">

					{/* Quick Trade Widget */}
					<div className="card ring-2 ring-primary/20">
						<div className="flex items-center gap-4 mb-8">
							<div className="p-3 bg-primary rounded-2xl text-black shadow-lg shadow-primary/20">
								<span className="material-symbols-outlined text-2xl font-black">bolt</span>
							</div>
							<div>
								<h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">Giao dịch nhanh</h3>
								<p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Real-time Trading</p>
							</div>
						</div>

						<div className="space-y-6">
							<div className="grid grid-cols-2 gap-3 p-1.5 bg-background-light dark:bg-background-dark/80 rounded-2xl border border-border-light dark:border-border-dark">
								<button
									onClick={() => setTradeType('buy')}
									className={`py-3 text-[11px] font-black rounded-xl transition-all ${tradeType === 'buy' ? 'bg-primary text-black shadow-xl ring-2 ring-primary/30' : 'text-text-muted hover:text-black dark:hover:text-white'}`}
								>MUA</button>
								<button
									onClick={() => setTradeType('sell')}
									className={`py-3 text-[11px] font-black rounded-xl transition-all ${tradeType === 'sell' ? 'bg-primary text-black shadow-xl ring-2 ring-primary/30' : 'text-text-muted hover:text-black dark:hover:text-white'}`}
								>BÁN</button>
							</div>

							<div className="space-y-5">
								<div className="space-y-2">
									<div className="flex justify-between px-1">
										<span className="text-label !mb-0">Mã cổ phiếu</span>
										{isFetchingPrice && <span className="text-[10px] text-primary animate-pulse font-black uppercase">Checking...</span>}
									</div>
									<div className="relative">
										<input
											type="text"
											value={ticker}
											onChange={(e) => setTicker(e.target.value.toUpperCase())}
											className="input-field"
											placeholder="Nhập mã (HPG, VIC...)"
										/>
										<div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
											<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
											<span className="text-[10px] font-black text-black/20 dark:text-white/20 uppercase tracking-widest">LIVE</span>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<span className="text-label !mb-0">Số lượng cần {tradeType === 'buy' ? 'mua' : 'bán'}</span>
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="input-field"
										placeholder="0"
									/>
								</div>
							</div>

							<div className="pt-6 space-y-4 border-t border-dashed border-border-light dark:border-border-dark mt-6">
								<div className="flex justify-between items-center text-xs font-bold px-1">
									<span className="text-text-muted uppercase tracking-widest">Giá thị trường</span>
									<span className="text-black dark:text-white font-black">{estimatedPrice > 0 ? formatVND(estimatedPrice) : '---'}</span>
								</div>
								<div className="flex justify-between items-center text-xs font-bold px-1">
									<span className="text-text-muted uppercase tracking-widest">Ước tính phí</span>
									<span className="text-black dark:text-white font-black">{formatVND(estimatedFee)}</span>
								</div>

								<div className="flex justify-between items-center bg-black dark:bg-white/5 p-5 rounded-2xl mt-4">
									<span className="text-[11px] font-black text-white/60 dark:text-white/40 uppercase tracking-[0.2em]">Tổng cộng</span>
									<span className="text-2xl font-black text-primary tabular-nums">{formatVND(grandTotal)}</span>
								</div>

								<button
									onClick={handlePlaceOrder}
									disabled={isPlacingOrder || estimatedPrice <= 0}
									className={`btn-primary w-full shadow-2xl !py-5 uppercase tracking-[0.2em] text-xs font-black ${isPlacingOrder ? 'opacity-50' : ''}`}
								>
									{isPlacingOrder ? 'Đang thực hiện...' : `Xác nhận ${tradeType === 'buy' ? 'MUA' : 'BÁN'}`}
								</button>
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
							<button className="text-[11px] font-black text-black dark:text-white hover:text-primary underline underline-offset-8 decoration-2 decoration-primary/50 transition-all uppercase tracking-[0.2em]">Khám phá thêm</button>
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
									</tr>
								</thead>
								<tbody className="text-sm">
									{recentHistory.length > 0 ? recentHistory.map((t, i) => (
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
										</tr>
									)) : (
										<tr>
											<td colSpan="6" className="py-32 text-center">
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
