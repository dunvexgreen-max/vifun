/**
 * Utility for parsing bank transfer emails using regex patterns.
 * Inspired by the logic in the GAS backend.
 */
export const gmailParser = {
	parseEmail(subject, body, from, date) {
		const fullContent = `${from}\n${subject}\n${body}`.toLowerCase();

		// Basic filter for financial emails
		const financialKeywords = [
			'số dư', 'giao dịch', 'biến động', 'biên lai', 'thanh toán',
			'chuyển khoản', 'nhận tiền', 'vừa bị trừ', 'vừa nhận được',
			'vietcombank', 'techcombank', 'mbbank', 'acb', 'tpb', 'bidv', 'vpbank'
		];
		if (!financialKeywords.some(k => fullContent.includes(k))) return null;

		// Blacklist for non-transaction emails
		const blacklist = ['login alert', 'mật khẩu', 'otp', 'security', 'quảng cáo'];
		if (blacklist.some(k => fullContent.includes(k))) return null;

		// Extraction logic
		let amount = 0;
		let type = 'EXPENSE';
		let description = subject;
		let category = 'Ngân hàng';
		let source = 'Bank';

		// Detect Bank
		if (fullContent.includes('vietcombank')) source = 'Vietcombank';
		else if (fullContent.includes('techcombank')) source = 'Techcombank';
		else if (fullContent.includes('mbbank')) source = 'MBBank';
		else if (fullContent.includes('tpb')) source = 'TPBank';
		else if (fullContent.includes('acb')) source = 'ACB';

		// Extract Amount
		const amountMatch = body.match(/([\d,]{4,})\s?VND/i) || body.match(/([\d.]{4,})\s?VND/i);
		if (amountMatch) {
			amount = parseFloat(amountMatch[1].replace(/,/g, ''));
		}

		// Detect Type
		if (fullContent.includes('nhận được') || fullContent.includes('cộng') || fullContent.includes('+')) {
			type = 'INCOME';
		} else if (fullContent.includes('bị trừ') || fullContent.includes('thanh toán') || fullContent.includes('-')) {
			type = 'EXPENSE';
		}

		return {
			date: date.toISOString(),
			amount,
			actual: amount,
			type,
			category,
			description,
			source,
			status: 'PENDING_SYNC', // Marker for Firestore queue
			rawContent: body.substring(0, 500) // For debugging if needed
		};
	}
};
