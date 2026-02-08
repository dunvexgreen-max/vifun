import React, { useState } from 'react';
import { api } from '../api';

const Portfolio = ({ holdings, refreshProfile }) => {
	const [loading, setLoading] = useState(false);

	const handleRefresh = async () => {
		if (loading) return;
		setLoading(true);
		try {
			await api.call('refreshStockPrices', { apiKey: 'STOCKS_SIM_SECURE_V1_2024_@SEC' });
			if (refreshProfile) await refreshProfile();
		} catch (error) {
			console.error("Lỗi làm mới giá:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(val || 0));

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
				<div>
					<h2 className="text-h2 flex items-center gap-3">
						<span className="material-symbols-outlined text-primary text-3xl">work</span>
						Danh mục nắm giữ
					</h2>
					<p className="text-body-muted mt-1">Quản lý hiệu quả các khoản đầu tư của bạn</p>
				</div>
				<button
					onClick={handleRefresh}
					disabled={loading}
					className="btn-primary"
				>
					{loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">sync</span>}
					{loading ? 'Đang cập nhật...' : 'Làm mới giá'}
				</button>
			</div>

			{/* Moblie Card View */}
			<div className="grid grid-cols-1 gap-4 lg:hidden">
				{holdings && holdings.length > 0 ? holdings.map((item, index) => {
					const currentPrice = item.currentPrice || item.avgPrice;
					const totalCost = item.quantity * item.avgPrice;
					const currentValue = item.value || (item.quantity * currentPrice);
					const profit = item.pnl !== undefined ? item.pnl : (currentValue - totalCost);
					const profitPct = item.pnlPct !== undefined ? item.pnlPct : (((currentPrice - item.avgPrice) / item.avgPrice) * 100);
					const isProfit = profit >= 0;

					return (
						<div key={index} className="card space-y-4">
							<div className="flex justify-between items-start">
								<div className="flex items-center gap-3">
									<div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary text-sm border border-primary/20">
										{item.symbol[0]}
									</div>
									<div>
										<h3 className="font-bold text-text-main dark:text-white text-lg tracking-tight leading-none mb-1">{item.symbol}</h3>
										<p className="text-label">Sàn HSX</p>
									</div>
								</div>
								<div className="text-right">
									<p className={`text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>{isProfit ? '+' : ''}{formatVND(profit)}</p>
									<span className={isProfit ? 'badge-success' : 'badge-danger'}>
										{isProfit ? '+' : ''}{profitPct.toFixed(2)}%
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-light dark:border-border-dark">
								<div className="space-y-1">
									<p className="text-label">Số lượng</p>
									<p className="text-sm font-bold text-text-main dark:text-white">{item.quantity.toLocaleString()}</p>
								</div>
								<div className="space-y-1 text-right">
									<p className="text-label">Giá trị TT</p>
									<p className="text-sm font-bold text-text-main dark:text-white">{formatVND(currentValue)}</p>
								</div>
								<div className="space-y-1">
									<p className="text-label">Giá vốn TB</p>
									<p className="text-xs font-medium text-text-muted">{formatVND(item.avgPrice)}</p>
								</div>
								<div className="space-y-1 text-right">
									<p className="text-label">Giá hiện tại</p>
									<p className="text-xs font-bold text-primary">{formatVND(currentPrice)}</p>
								</div>
							</div>
						</div>
					);
				}) : (
					<div className="card flex flex-col items-center gap-4 opacity-30 text-center">
						<span className="material-symbols-outlined text-5xl">inventory_2</span>
						<p className="text-label">Danh mục trống</p>
					</div>
				)}
			</div>

			{/* Desktop Table View */}
			<div className="hidden lg:block card !p-0 overflow-hidden">
				<div className="w-full overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[1000px]">
						<thead>
							<tr className="bg-background-light dark:bg-background-dark/50 text-label border-b border-border-light dark:border-border-dark">
								<th className="px-8 py-5">Mã CP</th>
								<th className="px-6 py-5 text-right">Số lượng</th>
								<th className="px-6 py-5 text-right">Giá vốn TB</th>
								<th className="px-6 py-5 text-right">Giá hiện tại</th>
								<th className="px-6 py-5 text-right">Giá trị TT</th>
								<th className="px-8 py-5 text-right">Lãi / Lỗ</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-app-border text-sm font-medium">
							{holdings && holdings.length > 0 ? holdings.map((item, index) => {
								const currentPrice = item.currentPrice || item.avgPrice;
								const totalCost = item.quantity * item.avgPrice;
								const currentValue = item.value || (item.quantity * currentPrice);
								const profit = item.pnl !== undefined ? item.pnl : (currentValue - totalCost);
								const profitPct = item.pnlPct !== undefined ? item.pnlPct : (((currentPrice - item.avgPrice) / item.avgPrice) * 100);
								const isProfit = profit >= 0;

								return (
									<tr key={index} className="group hover:bg-background-light dark:bg-background-dark/30 transition-colors">
										<td className="px-8 py-6">
											<div className="flex items-center gap-3">
												<div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary text-xs border border-primary/20">
													{item.symbol[0]}
												</div>
												<div className="flex flex-col">
													<span className="text-base font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{item.symbol}</span>
													<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">HSX Online</span>
												</div>
											</div>
										</td>
										<td className="px-6 py-6 text-right font-bold text-text-main dark:text-white">
											{item.quantity.toLocaleString()}
										</td>
										<td className="px-6 py-6 text-right text-text-muted">
											{formatVND(item.avgPrice)}
										</td>
										<td className="px-6 py-6 text-right font-bold text-primary">
											{formatVND(currentPrice)}
										</td>
										<td className="px-6 py-6 text-right font-bold text-text-main dark:text-white">
											{formatVND(currentValue)}
										</td>
										<td className="px-8 py-6 text-right whitespace-nowrap">
											<div className={`flex flex-col items-end gap-1 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
												<div className="font-bold text-base tracking-tight leading-none mb-1">
													{isProfit ? '+' : ''}{formatVND(profit)}
												</div>
												<span className={isProfit ? 'badge-success' : 'badge-danger'}>
													{isProfit ? '+' : ''}{profitPct.toFixed(2)}%
												</span>
											</div>
										</td>
									</tr>
								);
							}) : (
								<tr>
									<td colSpan="6" className="py-20 text-center text-text-muted opacity-30">
										<p className="text-label">Không có dữ liệu cổ phiếu</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Info Box */}
			<div className="card flex items-start gap-4">
				<div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
					<span className="material-symbols-outlined">info</span>
				</div>
				<div className="flex-1 space-y-1">
					<h4 className="text-xs font-bold uppercase tracking-wider text-text-main dark:text-white">Quy định về Phí và Thuế</h4>
					<p className="text-xs font-medium text-text-muted leading-relaxed">
						Giá vốn trung bình đã bao gồm <span className="text-text-main dark:text-white font-bold">0.15% phí mua</span>.
						Khi bán, hệ thống sẽ tự động khấu trừ <span className="text-text-main dark:text-white font-bold">0.2% (Phí + Thuế TNCN)</span> trực tiếp vào số tiền thu về để tính toán Lãi/Lỗ ròng thực tế.
					</p>
				</div>
			</div>
		</div>
	);
};

export default Portfolio;
