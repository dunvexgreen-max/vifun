import { gmailParser } from "./gmailParser";

export const gmailCrawler = {
	/**
	 * Fetches and parses recent bank emails from the user's Gmail.
	 */
	async crawl(accessToken, maxResults = 20) {
		try {
			const query = `newer_than:2d ("biên lai" OR "biến động" OR "giao dịch" OR "thanh toán")`;
			const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

			const response = await fetch(listUrl, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});
			const data = await response.json();

			if (!data.messages) return [];

			const transactions = [];
			for (const msgSummary of data.messages) {
				const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}`;
				const msgResp = await fetch(msgUrl, {
					headers: { Authorization: `Bearer ${accessToken}` }
				});
				const msgData = await msgResp.json();

				const headers = msgData.payload.headers;
				const subject = headers.find(h => h.name === 'Subject')?.value || '';
				const from = headers.find(h => h.name === 'From')?.value || '';
				const date = new Date(parseInt(msgData.internalDate));

				// Get body (simplified base64 decode)
				let body = "";
				if (msgData.payload.parts) {
					const part = msgData.payload.parts.find(p => p.mimeType === 'text/plain') || msgData.payload.parts[0];
					if (part.body.data) body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
				} else if (msgData.payload.body.data) {
					body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
				}

				const parsed = gmailParser.parseEmail(subject, body, from, date);
				if (parsed) {
					transactions.push({ ...parsed, gmailId: msgSummary.id });
				}
			}

			return transactions;

		} catch (error) {
			console.error("Gmail Crawl Error:", error);
			throw error;
		}
	}
};
