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

const LineChart = () => {
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
				backgroundColor: '#162235',
				titleColor: '#94A3B8',
				bodyColor: '#FFFFFF',
				borderColor: 'rgba(255, 255, 255, 0.1)',
				borderWidth: 1,
				padding: 12,
				cornerRadius: 12,
			},
		},
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					display: false,
				},
			},
			y: {
				grid: {
					color: 'rgba(255, 255, 255, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 10,
					},
				},
			},
		},
	};

	const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	const data = {
		labels,
		datasets: [
			{
				fill: true,
				label: 'Tài sản',
				data: [100, 105, 103, 110, 115, 112, 120, 135, 130, 140, 145, 158], // Mocked trend
				borderColor: '#3B82F6',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 6,
				borderWidth: 3,
			},
		],
	};

	return <Line options={options} data={data} />;
};

export default LineChart;
