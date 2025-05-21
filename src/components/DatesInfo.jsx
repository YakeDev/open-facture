import React from 'react'

export default function DatesInfo({ data, onChange }) {
	const h = (key) => (e) => onChange({ ...data, [key]: e.target.value })
	return (
		<div className='grid md:grid-cols-2 gap-4 mb-6'>
			<div></div>
			<div className='space-y-2 text-right'>
				<div className='flex justify-end items-center'>
					<label className='w-32 text-sm text-gray-600'>Date</label>
					<input
						type='date'
						value={data.date}
						onChange={h('date')}
						className='border border-gray-200 p-1 rounded w-40 ml-2 text-right'
					/>
				</div>
				<div className='flex justify-end items-center'>
					<label className='w-32 text-sm text-gray-600'>Modalités</label>
					<input
						type='text'
						value={data.terms}
						onChange={h('terms')}
						className='border border-gray-200 p-1 rounded w-40 ml-2 text-right'
					/>
				</div>
				<div className='flex justify-end items-center'>
					<label className='w-32 text-sm text-gray-600'>Échéance</label>
					<input
						type='date'
						value={data.dueDate}
						onChange={h('dueDate')}
						className='border border-gray-200 p-1 rounded w-40 ml-2 text-right'
					/>
				</div>
				<div className='flex justify-end items-center'>
					<label className='w-32 text-sm text-gray-600'>N° commande</label>
					<input
						type='text'
						value={data.poNumber}
						onChange={h('poNumber')}
						className='border border-gray-200 p-1 rounded w-40 ml-2 text-right'
					/>
				</div>
			</div>
		</div>
	)
}
