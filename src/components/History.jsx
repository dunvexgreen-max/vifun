import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { History as HistoryIcon, Tag } from 'lucide-react';

const History = ({ profile, refreshProfile }) => {
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(true);

	const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val);
	const formatDate = (dateStr) => {
		const d = new Date(dateStr);
		return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
	};

	const loadHistory = async () => {
		const data = await api.call('getHistory', { email: profile.email });
		setHistory(data);
		setLoading(false);
	};

	useEffect(() => {
		loadHistory();
	}, []);

	const handleDelete = async (item) => {
		if (!window.confirm(`Bạn có chắc muốn xóa giao dịch ${item.symbol} (${item.side} ${item.quantity})? Điều này sẽ cập nhật lại số dư và cổ phiếu của bạn.`)) return;

		try {
			const res = await api.call('deleteTransaction', { email: profile.email, id: item.id });
			if (res.success) {
				alert('Đã xóa giao dịch thành công!');
				loadHistory();
				if (refreshProfile) refreshProfile();
			} else {
				alert('Lỗi: ' + res.message);
			}
		} catch (e) {
			alert('Lỗi kết nối: ' + e.message);
		}
	};

	return (
		<div className="space-y-6 animate-in duration-500">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
				<h2 className="text-h2 flex items-center gap-3 uppercase">
					<HistoryIcon className="text-primary" size={24} />
					LỊCH SỬ GIAO DỊCH
				</h2>
			</div>

			{/* Mobile History List */}
			<div className="lg:hidden space-y-4 px-1">
				{loading ? (
					<div className="p-20 text-center opacity-20">
						<Tag size={40} className="mx-auto mb-4 animate-pulse" />
						<p className="text-label">Đang tải...</p>
					</div>
				) : history.length === 0 ? (
					<div className="p-20 text-center opacity-20">
						<HistoryIcon size={40} className="mx-auto mb-4" />
						<p className="text-label">Chưa có giao dịch</p>
					</div>
				) : history.map((item, i) => (
					<div key={item.id || i} className="card relative overflow-hidden !p-5">
						<div className={`absolute top-0 left-0 bottom-0 w-1 ${item.side === 'BUY' ? 'bg-emerald-500' : item.side === 'SELL' ? 'bg-rose-500' : 'bg-primary'}`}></div>

						<div className="flex justify-between items-start pl-2">
							<div>
								<span className={item.side === 'BUY' ? 'badge-success' : 'badge-danger'}>
									{item.side === 'BUY' ? 'MUA' : item.side === 'SELL' ? 'BÁN' : 'NẠP'} {item.type}
								</span>
								<h3 className="text-xl font-black text-text-main dark:text-white tracking-tighter uppercase mt-2">{item.symbol}</h3>
							</div>
							<div className="text-right">
								<p className="text-label !opacity-50 mb-1">{formatDate(item.date)}</p>
								<button
									onClick={() => handleDelete(item)}
									className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/10 active:scale-90 transition-all"
								>
									<span className="material-symbols-outlined text-sm">delete</span>
								</button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 pl-2 pt-4 border-t border-border-light dark:border-border-dark mt-4">
							<div className="space-y-0.5">
								<p className="text-label opacity-50">Số lượng</p>
								<p className="text-sm font-black text-text-main dark:text-white">{(item.quantity || 0).toLocaleString()}</p>
							</div>
							<div className="space-y-0.5 text-right">
								<p className="text-label opacity-50">Tổng tiền</p>
								<p className="text-sm font-black text-text-main dark:text-white">{formatVND(item.total || 0)}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Desktop Table View */}
			<div className="hidden lg:block card overflow-hidden !p-0">
				<div className="w-full overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[1000px]">
						<thead>
							<tr className="bg-background-light dark:bg-background-dark/50 text-label border-b border-border-light dark:border-border-dark">
								<th className="px-8 py-6">Thời gian</th>
								<th className="px-6 py-6 font-black">Mã CP</th>
								<th className="px-6 py-6">Phân loại</th>
								<th className="px-6 py-6 text-right">Số lượng</th>
								<th className="px-6 py-6 text-right">Tổng tiền</th>
								<th className="px-6 py-6 text-right font-black">Giá khớp</th>
								<th className="px-8 py-6 text-center">Xóa</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-app-border text-sm">
							{loading ? (
								<tr><td colSpan="7" className="text-center py-20 text-text-muted text-xs font-black uppercase tracking-widest opacity-20">Đang tải dữ liệu...</td></tr>
							) : history.length === 0 ? (
								<tr><td colSpan="7" className="text-center py-20 text-text-muted text-xs font-black uppercase tracking-widest opacity-20">Chưa có giao dịch nào</td></tr>
							) : history.map((item, i) => {
								return (
									<tr key={item.id || i} className="group hover:bg-background-light dark:bg-background-dark/30 transition-colors">
										<td className="px-8 py-6 text-text-muted font-medium whitespace-nowrap">{formatDate(item.date)}</td>
										<td className="px-6 py-6 font-black text-text-main dark:text-white text-lg tracking-tighter group-hover:text-primary transition-all underline decoration-primary/20 decoration-2 underline-offset-4">{item.symbol}</td>
										<td className="px-6 py-6">
											<span className={item.side === 'BUY' ? 'badge-success' : item.side === 'SELL' ? 'badge-danger' : 'badge-success'}>
												{item.side === 'BUY' ? 'MUA' : item.side === 'SELL' ? 'BÁN' : 'NẠP'} {item.type}
											</span>
										</td>
										<td className="px-6 py-6 text-right font-black text-text-main dark:text-white">{(item.quantity || 0).toLocaleString()}</td>
										<td className="px-6 py-6 text-right font-black text-text-main dark:text-white">{formatVND(item.total || 0)}</td>
										<td className="px-6 py-6 text-right font-black text-primary">
											{item.symbol === 'DEPOSIT' ? '--' : formatVND(item.price || 0)}
										</td>
										<td className="px-8 py-6 text-center">
											<button
												onClick={() => handleDelete(item)}
												className="p-3 bg-background-light dark:bg-background-dark hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-2xl transition-all border border-border-light dark:border-border-dark group/btn"
											>
												<span className="material-symbols-outlined text-base">delete</span>
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default History;
