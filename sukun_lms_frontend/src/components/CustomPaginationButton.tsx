import React, { FC, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CardFooter, CardFooterLeft, CardFooterRight } from './bootstrap/Card';
import Pagination, { PaginationItem } from './bootstrap/Pagination';
import Select from './bootstrap/forms/Select';
import Option from './bootstrap/Option';

export const PER_COUNT = {
	3: 3,
	5: 5,
	10: 10,
	25: 25,
	50: 50,
} as const;

interface IPaginationButtonsProps {
	setCurrentPage: (page: number) => void;
	currentPage: number;
	perPage: number;
	setPerPage: (perPage: number) => void;
	totalCount: number;
	label?: string;
}

const PaginationButtons: FC<IPaginationButtonsProps> = ({
	setCurrentPage,
	currentPage,
	perPage,
	setPerPage,
	totalCount,
	label = 'items',
}) => {
	const totalPages = useMemo(() => Math.ceil(totalCount / perPage), [totalCount, perPage]);

	const getPaginationItems = () => {
		if (totalPages <= 1) return null;

		const items = [];
		const maxVisiblePages = 5;
		let startPage = 1;
		let endPage = totalPages;

		if (totalPages > maxVisiblePages) {
			const halfVisible = Math.floor(maxVisiblePages / 2);
			startPage = Math.max(1, currentPage - halfVisible);
			endPage = Math.min(totalPages, currentPage + halfVisible);

			if (currentPage <= halfVisible) {
				endPage = maxVisiblePages;
			} else if (currentPage >= totalPages - halfVisible) {
				startPage = totalPages - maxVisiblePages + 1;
			}
		}

		// First page and ellipsis
		if (startPage > 1) {
			items.push(
				<PaginationItem key={1} onClick={() => setCurrentPage(1)}>
					1
				</PaginationItem>,
			);
			if (startPage > 2) {
				items.push(
					<PaginationItem key='start-ellipsis' isDisabled>
						...
					</PaginationItem>,
				);
			}
		}

		// Page numbers
		for (let i = startPage; i <= endPage; i++) {
			items.push(
				<PaginationItem
					key={i}
					isActive={i === currentPage}
					onClick={() => setCurrentPage(i)}>
					{i}
				</PaginationItem>,
			);
		}

		// Last page and ellipsis
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				items.push(
					<PaginationItem key='end-ellipsis' isDisabled>
						...
					</PaginationItem>,
				);
			}
			items.push(
				<PaginationItem key={totalPages} onClick={() => setCurrentPage(totalPages)}>
					{totalPages}
				</PaginationItem>,
			);
		}

		return items;
	};

	const getInfoText = () => {
		const startItem = (currentPage - 1) * perPage + 1;
		const endItem = Math.min(currentPage * perPage, totalCount);
		return `Showing ${startItem} to ${endItem} of ${totalCount} ${label}`;
	};

	const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newPerPage = parseInt(e.target.value, 10);
		setPerPage(newPerPage);
		setCurrentPage(1); // Reset to first page when changing items per page
	};

	return (
		<CardFooter>
			{totalCount > 0 && (
				<CardFooterLeft>
					<span className='text-muted'>{getInfoText()}</span>
				</CardFooterLeft>
			)}

			<CardFooterRight className='d-flex align-items-center gap-2'>
				{/* Show pagination controls only when there are multiple pages */}
				{totalPages > 1 && (
					<Pagination ariaLabel={label}>
						<PaginationItem
							isFirst
							isDisabled={currentPage === 1}
							onClick={() => setCurrentPage(1)}
						/>
						<PaginationItem
							isPrev
							isDisabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
						/>

						{getPaginationItems()}

						<PaginationItem
							isNext
							isDisabled={currentPage === totalPages}
							onClick={() => setCurrentPage(currentPage + 1)}
						/>
						<PaginationItem
							isLast
							isDisabled={currentPage === totalPages}
							onClick={() => setCurrentPage(totalPages)}
						/>
					</Pagination>
				)}

				{/* Show items-per-page selector only when there's only one page */}
				{/* {totalPages <= 1 && ( */}
				<Select
					size='sm'
					ariaLabel='Per page'
					onChange={handlePerPageChange}
					value={perPage.toString()}>
					{Object.entries(PER_COUNT).map(([key, value]) => (
						// @ts-ignore
						<Option key={key} value={key}>
							{value}
						</Option>
					))}
				</Select>
				{/* )} */}
			</CardFooterRight>
		</CardFooter>
	);
};

PaginationButtons.propTypes = {
	setCurrentPage: PropTypes.func.isRequired,
	currentPage: PropTypes.number.isRequired,
	perPage: PropTypes.number.isRequired,
	setPerPage: PropTypes.func.isRequired,
	totalCount: PropTypes.number.isRequired,
	label: PropTypes.string,
};

export default PaginationButtons;
