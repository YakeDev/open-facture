import React from 'react'

export default function SummaryPanel({
	subtotal,
	taxRate,
	onTaxChange,
	total,
	amountPaid,
	onPaidChange,
	balanceDue,
	currency,
}) {
	const symbol = currency?.symbol ?? currency?.code ?? ''
	return (
		<div className='bg-white p-4 rounded shadow border border-gray-200'>
			<div className='flex justify-between mb-2 border-b border-gray-200 pb-2'>
		<span>Sous-total</span>
				<span>
					{subtotal.toFixed(2).replace('.', ',')} {symbol}
				</span>
			</div>
			<div className='flex justify-between items-center mb-2'>
				<span>Taxe</span>
				<div className='flex items-center'>
					<input
						type='number'
						value={taxRate}
						onChange={(e) => onTaxChange(Number(e.target.value))}
						className='w-12 border border-gray-200 p-1 rounded text-right inline-block mr-1'
					/>
					%
				</div>
			</div>
			<div className='flex justify-between mb-2 border-b border-gray-200 pb-2'>
				<span>Total</span>
				<span>
					{total.toFixed(2).replace('.', ',')} {symbol}
				</span>
			</div>
			<div className='flex justify-between items-center mb-2'>
		<span>Montant payé</span>
				<input
					type='number'
					value={amountPaid}
					onChange={(e) => onPaidChange(Number(e.target.value))}
					className='w-20 border border-gray-200 p-1 rounded text-right'
				/>
			</div>
			<div className='flex justify-between mb-0 border-t border-gray-200 pt-2'>
				<span>Solde dû</span>
				<span>
					{balanceDue.toFixed(2).replace('.', ',')} {symbol}
				</span>
			</div>
		</div>
	)
}
