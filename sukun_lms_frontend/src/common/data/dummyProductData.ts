import BeveledCone from '../../assets/img/abstract/beveled-cone.png';
import CloudBall from '../../assets/img/abstract/cloud-ball.png';
import Quadrilateral from '../../assets/img/abstract/quadrilateral.png';
import HardSharpDonut from '../../assets/img/abstract/hald-sharp-donut.png';
import BendyRectangle from '../../assets/img/abstract/bendy-rectangle.png';
import Infinity from '../../assets/img/abstract/infinity.png';
import Octahedron from '../../assets/img/abstract/octahedron.png';
import Triangle from '../../assets/img/abstract/triangle.png';
import SquiglyGlobe from '../../assets/img/abstract/squigly-globe.png';
import Dodecagon from '../../assets/img/abstract/dodecagon.png';
import BeveledCube from '../../assets/img/abstract/beveled-cube.png';
import Cylinder from '../../assets/img/abstract/cylinder.png';

const data: {
	id: number;
	image: string;
	name: string;
	category: string;
	series: { data: number[] }[];
	color: string;
	stock: number;
	price: number;
	store: string;
	file: string;
	appearing?: boolean;
}[] = [
	{
		id: 1,
		image: "https://d33om22pidobo4.cloudfront.net/blogs/covers/ezgifcom-webp-to-jpg-convertedjpg-e39a4503-2541-4c61-bd57-4e6a8fe7c8b2jpgd1500x999-y-fwebp.jpeg?d=1500x999&f=webp",
		name: 'Site 1',
		category: 'Description....',
		series: [
			{
				data: [25, 66, 41, 89, 63],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 380,
		price: 14.5,
		store: 'Company A',
		file: 'Figma',
	},
	{
		id: 2,
		image: "data:image/jpeg;base64,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",
		name: 'Site 2',
		category: 'Description....',
		series: [
			{
				data: [12, 24, 33, 12, 48],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 1245,
		price: 12,
		store: 'Company A',
		file: 'Figma',
	},
	{
		id: 3,
		image: Quadrilateral,
		name: 'Site 3',
		category: 'Description....',
		series: [
			{
				data: [34, 32, 36, 34, 34],
			},
		],
		color: String(import.meta.env.VITE_WARNING_COLOR),
		stock: 27,
		price: 12.8,
		store: 'Company D',
		file: 'XD',
	},
	{
		id: 4,
		image: HardSharpDonut,
		name: 'Site 4',
		category: 'Description....',
		series: [
			{
				data: [54, 34, 42, 23, 12],
			},
		],
		color: String(import.meta.env.VITE_DANGER_COLOR),
		stock: 219,
		price: 16,
		store: 'Company C',
		file: 'Sketch',
	},
	{
		id: 5,
		image: BendyRectangle,
		name: 'Site 5',
		category: 'Description....',
		series: [
			{
				data: [23, 21, 12, 34, 14],
			},
		],
		color: String(import.meta.env.VITE_DANGER_COLOR),
		stock: 219,
		price: 16,
		store: 'Company A',
		file: 'Figma',
	},
	{
		id: 6,
		image: Infinity,
		name: 'Site 6',
		category: 'Description....',
		series: [
			{
				data: [23, 13, 34, 41, 38],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company C',
		file: 'Figma',
	},
	{
		id: 7,
		image: Octahedron,
		name: 'Site 7',
		category: 'Description....',
		series: [
			{
				data: [21, 34, 23, 12, 67],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 498,
		price: 18,
		store: 'Company B',
		file: 'Figma',
	},
	{
		id: 8,
		image: Triangle,
		name: 'Site 8',
		category: 'Description....',
		series: [
			{
				data: [18, 32, 26, 15, 34],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company B',
		file: 'Figma',
	},
	{
		id: 9,
		image: SquiglyGlobe,
		name: 'Site 9',
		category: 'Description....',
		series: [
			{
				data: [18, 32, 26, 15, 34],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company C',
		file: 'Figma',
	},
	{
		id: 10,
		image: Dodecagon,
		name: 'Site 10',
		category: 'Description....',
		series: [
			{
				data: [18, 32, 26, 15, 34],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company A',
		file: 'Figma',
	},
	{
		id: 11,
		image: BeveledCube,
		name: 'Site 11',
		category: 'Description....',
		series: [
			{
				data: [18, 32, 26, 15, 34],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company A',
		file: 'Figma',
	},
	{
		id: 12,
		image: Cylinder,
		name: 'Site 12',
		category: 'Description....',
		series: [
			{
				data: [18, 32, 26, 15, 34],
			},
		],
		color: String(import.meta.env.VITE_SUCCESS_COLOR),
		stock: 219,
		price: 16,
		store: 'Company B',
		file: 'Figma',
	},
];
export default data;
