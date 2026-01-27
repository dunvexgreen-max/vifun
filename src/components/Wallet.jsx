import React, { useState } from 'react';
import { api } from '../api';
import { CreditCard, Plus, ArrowUpRight, ShieldCheck } from 'lucide-react';

const Wallet = ({ profile, refreshProfile }) => {
	const [amount, setAmount] = useState('');
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');

	React.useEffect(() => {
		fetchHistory();
	}, []);

	const fetchHistory = async () => {
		const res = await api.call('getHistory', { email: sessionStorage.getItem('userEmail') });
		if (res && Array.isArray(res)) {
			// Lọc các giao dịch nạp tiền
			setHistory(res.filter(h => h.symbol === 'DEPOSIT'));
		}
	};

	const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

	const handleDeposit = async (e) => {
		e.preventDefault();
		if (!amount || amount <= 0) return;

		setLoading(true);
		const res = await api.call('deposit', { email: profile.email, amount: Number(amount) });
		if (res.success) {
			setMessage(`Đã nạp thành công ${formatVND(amount)} vào tài khoản!`);
			setAmount('');
			refreshProfile();
			fetchHistory();
		} else {
			setMessage(`Lỗi: ${res.error}`);
		}
		setLoading(false);
		setTimeout(() => setMessage(''), 5000);
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in slide-in-from-right-5 duration-500">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
				<h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight">Nạp tiền vào ví</h2>
				<div className="flex items-center gap-2 text-success text-[10px] font-black uppercase tracking-widest bg-success/5 px-3 py-1.5 rounded-full border border-success/10">
					<ShieldCheck size={14} />
					Giao dịch mô phỏng an toàn
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
				<div className="space-y-6">
					<div className="glass p-6 lg:p-8 rounded-[40px] bg-gradient-to-br from-primary/20 via-surface to-surface relative overflow-hidden group border-white/5 shadow-2xl">
						<div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700"></div>
						<div className="relative z-10 flex flex-col gap-10 lg:gap-12">
							<div className="flex justify-between items-start">
								<div className="p-3 bg-primary/10 rounded-2xl text-primary">
									<CreditCard size={28} strokeWidth={2.5} />
								</div>
								<span className="text-[10px] font-black tracking-[0.2em] text-textSecondary uppercase opacity-60">VIRTUAL CARD</span>
							</div>
							<div>
								<p className="text-textSecondary text-[10px] font-black mb-1 uppercase tracking-[0.15em] opacity-60">Số dư khả dụng</p>
								<h3 className="text-3xl lg:text-4xl font-black tracking-tighter">{formatVND(profile.balance)}</h3>
							</div>
							<div className="flex justify-between items-end border-t border-white/5 pt-6">
								<p className="font-mono text-xs tracking-[0.2em] opacity-40">{profile.email.toUpperCase()}</p>
								<div className="flex gap-1">
									<div className="w-8 h-5 bg-white/5 rounded-md"></div>
									<div className="w-8 h-5 bg-white/10 rounded-md"></div>
								</div>
							</div>
						</div>
					</div>

					<div className="glass p-6 lg:p-8 rounded-[40px] border-white/5 space-y-6">
						<h4 className="font-black text-[10px] uppercase text-textSecondary tracking-[0.2em] opacity-60">Lịch sử nạp gần đây</h4>
						<div className="flex flex-col gap-3">
							{history.length > 0 ? history.map((h, i) => (
								<div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
									<div className="flex gap-4 items-center">
										<div className="p-2.5 bg-success/10 rounded-xl text-success">
											<ArrowUpRight size={18} strokeWidth={3} />
										</div>
										<div className="flex flex-col">
											<span className="text-xs font-black text-white uppercase tracking-wider">Nạp vốn</span>
											<span className="text-[10px] text-textSecondary font-bold">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
										</div>
									</div>
									<span className="font-black text-white tracking-tight">{formatVND(h.total)}</span>
								</div>
							)) : (
								<div className="text-center py-10 opacity-20">
									<p className="text-xs font-black uppercase tracking-widest">Chưa có giao dịch nạp</p>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="glass p-6 lg:p-8 rounded-[40px] border-white/5 flex flex-col gap-8 shadow-2xl bg-gradient-to-b from-white/[0.02] to-transparent">
					<h3 className="text-xl font-black tracking-tight uppercase">Thêm nguồn vốn</h3>

					<form onSubmit={handleDeposit} className="space-y-8">
						<div className="space-y-3">
							<label className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] pl-1 opacity-60">Số tiền muốn nạp (VND)</label>
							<div className="relative">
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0"
									className="w-full bg-white/5 border-2 border-white/5 rounded-[24px] py-5 px-6 text-2xl lg:text-3xl font-black focus:border-primary/50 outline-none transition-all placeholder:opacity-20 tracking-tighter"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							{[10000000, 50000000, 100000000, 500000000].map(val => (
								<button
									key={val}
									type="button"
									onClick={() => setAmount(val)}
									className="py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 transition-all duration-300"
								>
									+{val >= 100000000 ? (val / 100000000) + ' Trăm Tr' : (val / 1000000) + ' Triệu'}
								</button>
							))}
						</div>

						<button
							type="submit"
							disabled={loading || !amount}
							className="w-full py-5 rounded-[24px] bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
						>
							{loading ? 'Đang nạp tiền...' : 'Xác nhận nạp vốn'}
						</button>

						{message && (
							<div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-center text-xs font-black uppercase tracking-widest leading-relaxed">
								{message}
							</div>
						)}
					</form>

					<div className="pt-4 border-t border-white/5">
						<p className="text-[9px] text-textSecondary text-center uppercase font-black tracking-[0.2em] opacity-40 leading-relaxed">
							⚠️ Đây là tiền ảo mô phỏng.<br />Giao dịch không có giá trị quy đổi thực tế.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Wallet;
