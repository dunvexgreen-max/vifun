import React, { useState, useEffect } from 'react';
import { api } from '../api';
import LineChart from './LineChart';

const Trade = ({ balance, refreshProfile }) => {
	const [symbol, setSymbol] = useState('HPG');
	const [stock, setStock] = useState(null);
	const [history, setHistory] = useState([]);
	const [side, setSide] = useState('BUY');
	const [type, setType] = useState('LO');
	const [price, setPrice] = useState('');
	const [quantity, setQuantity] = useState('');
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(false);
	const [message, setMessage] = useState('');

	const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

	const fetchStock = async () => {
		setFetching(true);
		const data = await api.call('getStockData', { symbol });
		if (data && !data.error) {
			setStock(data);
			if (type === 'MP') setPrice(data.price);
			else if (!price || price === '0') setPrice(data.price);
		}
		setFetching(false);
	};

	const fetchHistory = async () => {
		const res = await api.call('getStockHistory', { symbol });
		if (res && res.history) setHistory(res.history);
	};

	const handleSearch = () => {
		if (symbol && symbol.length >= 3) {
			fetchStock();
			fetchHistory();
		}
	};

	useEffect(() => {
		if (symbol && symbol.length >= 3) {
			fetchStock();
			fetchHistory();
		}
	}, []);

	const handleOrder = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');

		const res = await api.call('placeOrder', {
			email: sessionStorage.getItem('userEmail'),
			symbol: symbol.trim().toUpperCase(),
			quantity: Number(quantity),
			type: type,
			side: side,
			price: Number(price)
		});

		if (res && res.success) {
			setMessage(`Đã đặt lệnh ${side === 'BUY' ? 'MUA' : 'BÁN'} ${quantity} ${symbol} thành công!`);
			refreshProfile();
			setQuantity('');
		} else {
			setMessage(`Lỗi: ${res?.error || 'Không rõ lỗi'}`);
		}
		setLoading(false);
	};

	const estimatedTotal = Number(quantity) * (type === 'MP' ? (stock?.price || 0) : Number(price));

	const chartData = {
		labels: [...history].reverse().map(h => h.date),
		datasets: [{
			label: 'Giá đóng cửa',
			data: [...history].reverse().map(h => h.price),
			borderColor: '#f4e225',
			backgroundColor: 'rgba(244, 226, 37, 0.1)',
			fill: true,
			tension: 0.4,
			pointRadius: 4,
			pointHoverRadius: 6,
			borderWidth: 2,
		}]
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
			<div className="lg:col-span-3 space-y-6">
				{/* Chart Card */}
				<div className="card flex flex-col min-h-[450px]">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
						<div>
							<h3 className="text-text-main dark:text-white text-lg font-bold flex items-center gap-2">
								<span className="material-symbols-outlined text-primary">analytics</span>
								Biểu đồ xu hướng {symbol}
							</h3>
							<p className="text-body-muted">Dữ liệu thị trường thời gian thực</p>
						</div>
						<span className="badge-success bg-background-light dark:bg-background-dark">
							Lịch sử 5 ngày
						</span>
					</div>

					<div className="flex-1 w-full relative min-h-[300px]">
						{fetching && (
							<div className="absolute inset-0 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark/50 backdrop-blur-sm z-10 rounded-lg">
								<div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
								<p className="mt-4 text-label animate-pulse">Đang tải...</p>
							</div>
						)}
						{history.length > 0 ? (
							<LineChart data={chartData} />
						) : !fetching && (
							<div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 text-center">
								<span className="material-symbols-outlined text-6xl mb-4 text-text-main dark:text-white">monitoring</span>
								<p className="text-sm font-bold text-text-main dark:text-white">Nhập mã chứng khoán để xem biểu đồ</p>
							</div>
						)}
					</div>
				</div>

				{/* History Table Card */}
				<div className="card overflow-hidden">
					<div className="flex items-center gap-3 mb-6">
						<span className="material-symbols-outlined text-primary">history</span>
						<h3 className="text-text-main dark:text-white text-lg font-bold">Thống kê giá gần đây</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="border-b border-border-light dark:border-border-dark">
									<th className="pb-4 text-label">Ngày</th>
									<th className="pb-4 text-label">Giá đóng cửa</th>
									<th className="pb-4 text-label">Thay đổi</th>
									<th className="pb-4 text-label">Khối lượng</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-app-border">
								{history.map((h, i) => (
									<tr key={i} className="group hover:bg-background-light dark:bg-background-dark/30 transition-colors">
										<td className="py-4 text-sm font-medium">{h.date}</td>
										<td className="py-4 text-sm font-bold text-text-main dark:text-white">{formatVND(h.price)}</td>
										<td className={`py-4 text-sm font-bold ${String(h.change).includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
											{h.change}
										</td>
										<td className="py-4 text-body-muted font-medium">{h.volume}</td>
									</tr>
								))}
								{history.length === 0 && !fetching && (
									<tr><td colSpan="4" className="py-12 text-center text-text-muted text-xs opacity-50">Không có dữ liệu</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Trading Sidebar */}
			<div className="space-y-6">
				<div className="card space-y-6">
					{/* Side Toggle */}
					<div className="grid grid-cols-2 gap-2 p-1 bg-background-light dark:bg-background-dark rounded-lg">
						<button
							onClick={() => setSide('BUY')}
							className={`py-3 rounded-md font-bold text-xs transition-all ${side === 'BUY' ? 'bg-emerald-600 text-white shadow-md' : 'text-text-muted'}`}
						>MUA</button>
						<button
							onClick={() => setSide('SELL')}
							className={`py-3 rounded-md font-bold text-xs transition-all ${side === 'SELL' ? 'bg-rose-500 text-white shadow-md' : 'text-text-muted'}`}
						>BÁN</button>
					</div>

					<div className="space-y-4">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/60 text-xl">search</span>
								<input
									type="text"
									value={symbol}
									onChange={(e) => setSymbol(e.target.value.toUpperCase())}
									onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
									className="input-field pl-12"
									placeholder="Mã..."
								/>
							</div>
							<button
								onClick={handleSearch}
								disabled={fetching}
								className="btn-primary !px-4"
							>
								{fetching ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">search</span>}
							</button>
						</div>

						{stock && (
							<div className="p-5 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
								<div>
									<p className="text-label mb-1">Giá hiện tại</p>
									<p className={`text-2xl font-black ${Number(stock.change) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
										{formatVND(stock.price)}
									</p>
								</div>
								<div className="text-right">
									<p className={`text-sm font-bold ${Number(stock.change) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
										{stock.change} ({stock.changePercent}%)
									</p>
								</div>
							</div>
						)}

						<div className="space-y-4">
							<div className="space-y-1">
								<label className="text-label ml-1">Loại lệnh</label>
								<select
									value={type}
									onChange={(e) => setType(e.target.value)}
									className="select-field"
								>
									<option value="LO">LO (Lệnh giới hạn)</option>
									<option value="MP">MP (Lệnh thị trường)</option>
								</select>
							</div>
							<div className="space-y-1">
								<label className="text-label ml-1">Giá đặt</label>
								<input
									type="number"
									value={price}
									disabled={type === 'MP'}
									onChange={(e) => setPrice(e.target.value)}
									className="input-field"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-label ml-1">Số lượng</label>
								<input
									type="number"
									value={quantity}
									onChange={(e) => setQuantity(e.target.value)}
									className="input-field"
								/>
							</div>
						</div>
					</div>

					<div className="bg-background-light dark:bg-background-dark/50 p-4 rounded-xl space-y-2 border border-border-light dark:border-border-dark">
						<div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
							<span className="text-text-muted">Khả dụng:</span>
							<span className="text-text-main dark:text-white">{formatVND(balance)}</span>
						</div>
						<div className="flex justify-between text-sm font-black pt-2 border-t border-border-light dark:border-border-dark uppercase tracking-tight">
							<span className="text-text-muted">Tổng cộng:</span>
							<span className="text-primary">{formatVND(estimatedTotal)}</span>
						</div>
					</div>

					<button
						onClick={handleOrder}
						disabled={loading || !quantity || !stock}
						className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50 shadow-lg ${side === 'BUY' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}
					>
						{loading ? 'XỬ LÝ...' : `XÁC NHẬN ${side === 'BUY' ? 'MUA' : 'BÁN'}`}
					</button>

					{message && (
						<div className={`p-4 rounded-xl text-center text-xs font-black uppercase tracking-tight ${message.startsWith('Lỗi') ? 'badge-danger' : 'badge-success'} !flex justify-center`}>
							{message}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Trade;
