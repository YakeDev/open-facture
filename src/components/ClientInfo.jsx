import React from 'react'

export default function ClientInfo({ data, onChange }) {
	const h = (key) => (e) => onChange({ ...data, [key]: e.target.value })
	return (
		<div className='mb-6'>
			<label className='block text-sm text-gray-500 mb-1'>
				De qui est-ce ?
			</label>
			<input
				type='text'
				value={data.issuer}
				onChange={h('issuer')}
				className='w-full border border-gray-200 p-2 rounded mb-4'
			/>
			<div className='grid md:grid-cols-2 gap-4'>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>Bill To</label>
					<input
						type='text'
						value={data.billTo}
						onChange={h('billTo')}
						className='w-full border border-gray-200 p-2 rounded'
					/>
				</div>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>
						Ship To (facultatif)
					</label>
					<input
						type='text'
						value={data.shipTo}
						onChange={h('shipTo')}
						className='w-full border border-gray-200 p-2 rounded'
					/>
				</div>
			</div>
		</div>
	)
}
