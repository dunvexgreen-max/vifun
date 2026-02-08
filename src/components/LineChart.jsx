import React from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Filler,
	Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Filler,
	Legend
);

const LineChart = ({ data }) => {
	const isDark = document.documentElement.classList.contains('dark');

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				mode: 'index',
				intersect: false,
				backgroundColor: isDark ? '#1a1a08' : '#ffffff',
				titleColor: isDark ? '#ffffff' : '#1a1a05',
				bodyColor: isDark ? '#f4e225' : '#8c864f',
				borderColor: isDark ? 'rgba(244, 226, 37, 0.2)' : 'rgba(0, 0, 0, 0.05)',
				borderWidth: 1,
				padding: 12,
				cornerRadius: 12,
				callbacks: {
					label: function (context) {
						let label = context.dataset.label || '';
						if (label) {
							label += ': ';
						}
						if (context.parsed.y !== null) {
							label += new Intl.NumberFormat('vi-VN').format(context.parsed.y) + ' đ';
						}
						return label;
					}
				}
			},
		},
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: isDark ? '#8c864f' : '#8c864f',
					font: {
						size: 10,
						weight: 'bold'
					},
					maxRotation: 0,
					autoSkip: true,
					maxTicksLimit: 5
				},
			},
			y: {
				grid: {
					color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
				},
				ticks: {
					color: isDark ? '#8c864f' : '#8c864f',
					font: {
						size: 10,
					},
					beginAtZero: false,
					callback: function (value) {
						return value >= 1000 ? (value / 1000).toLocaleString('vi-VN') + 'k' : value;
					}
				},
			},
		},
	};

	// Default data if none provided
	const defaultData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasets: [
			{
				fill: true,
				label: 'Giá',
				data: [0, 0, 0, 0, 0, 0],
				borderColor: '#f4e225',
				backgroundColor: 'rgba(244, 226, 37, 0.05)',
				tension: 0.4,
				pointRadius: 4,
				pointHoverRadius: 6,
				borderWidth: 3,
			},
		],
	};

	return <Line options={options} data={data || defaultData} />;
};

export default LineChart;
